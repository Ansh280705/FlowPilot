import type { AIRequest, AIResponse, WorkflowStep } from '../types/workflow';
import { formatPoolExhaustedError, groqKeyPool, parseRetryAfterSeconds } from './groqKeyPool';

// 70b for accuracy, fall back to 8b instant on rate-limit
const AI_MODELS = [
  process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

const MAX_TOKENS = 1500;

function formatAIError(error: unknown): string {
  const err = error as { status?: number; message?: string; error?: { message?: string } };
  const detail = err?.error?.message || err?.message || 'Unknown AI error';
  if (err?.status === 429) return formatPoolExhaustedError();
  if (err?.status === 401) return 'Invalid Groq API key. Check GROQ_API_KEY in backend/.env';
  return detail;
}

const VALID_ACTIONS = ['click','type','select','wait','scroll','navigate','pressKey','hover','extract','upload','conditional'];

function sanitizeSteps(steps: unknown[]): WorkflowStep[] {
  return steps
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .filter(s => VALID_ACTIONS.includes(String(s.action ?? '')))
    .filter(s => s.selector || s.target || s.value)
    .map((s, i) => ({ ...s, id: String(s.id || `step-${i + 1}`) })) as WorkflowStep[];
}

export class AIService {
  async generateWorkflow(request: AIRequest): Promise<AIResponse> {
    if (!groqKeyPool.hasKeys()) {
      throw new Error('GROQ_API_KEY not configured. Add it to backend/.env and restart.');
    }

    const notAutomationMessage = this.checkIfNotAutomation(request.prompt);
    if (notAutomationMessage) {
      return { enhancedPrompt: request.prompt, workflow: [], reasoning: notAutomationMessage, confidence: 0 };
    }

    const isAgent = request.mode === 'agent';
    const prompt = this.buildPrompt(request);
    const triedKeyIndices = new Set<number>();
    let lastError: unknown;

    while (triedKeyIndices.size < groqKeyPool.size) {
      const acquired = groqKeyPool.acquire();
      if (!acquired) break;

      const { index: keyIndex, client: groq } = acquired;
      if (triedKeyIndices.has(keyIndex)) break;
      triedKeyIndices.add(keyIndex);

      for (const model of AI_MODELS) {
        try {
          const completion = await groq.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: isAgent ? this.getAgentSystemPrompt() : this.getWorkflowSystemPrompt() },
              { role: 'user', content: prompt },
            ],
            temperature: 0.1,
            max_tokens: MAX_TOKENS,
            response_format: { type: 'json_object' },
          });

          const content = completion.choices[0]?.message?.content || '{}';
          const parsed = this.parseAIJson(content);

          const rawWorkflow = parsed.workflow ?? parsed.steps ?? (Array.isArray(parsed) ? parsed : []);
          let workflow: WorkflowStep[] = sanitizeSteps(Array.isArray(rawWorkflow) ? rawWorkflow : []);

          const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning
            : (parsed.reasoning ? JSON.stringify(parsed.reasoning) : '');
          const done = parsed.done === true
            || (workflow.length === 0 && /complete|done|finished|success/i.test(reasoning));

          if (isAgent && workflow.length > 1) workflow = [workflow[0]];

          return {
            enhancedPrompt: this.enhancePrompt(request.prompt),
            workflow,
            reasoning,
            confidence: 0.85,
            done,
          };
        } catch (error) {
          lastError = error;
          const status = (error as { status?: number }).status;
          console.error(`Groq key #${keyIndex + 1}, model ${model}:`, (error as Error).message);
          if (status === 429) { groqKeyPool.markRateLimited(keyIndex, parseRetryAfterSeconds(error)); break; }
          if (status === 401) { groqKeyPool.markRateLimited(keyIndex, 86_400); break; }
          if (error instanceof SyntaxError) continue; // bad JSON → try next model
          throw new Error(formatAIError(error));
        }
      }
    }

    throw new Error(formatAIError(lastError));
  }

  private parseAIJson(content: string): Record<string, unknown> {
    try {
      return JSON.parse(content);
    } catch {
      const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned);
    }
  }

  private getAgentSystemPrompt(): string {
    return `Browser automation agent. Pick ONE next action toward the goal.

Return JSON: {"reasoning":"short reason","done":false,"workflow":[{"id":"s1","action":"click","target":"text","selector":"exact selector","value":"for type","description":"what"}]}
When goal complete: {"reasoning":"done","done":true,"workflow":[]}

Rules:
- 1 step max
- Use selector exactly as shown in elements list
- If an element shows [filled: xxx] it already has that value — skip it, move to next field
- Extract real values from user goal (names, emails, etc.)
- Never repeat a step you already completed`;
  }

  private getWorkflowSystemPrompt(): string {
    return `Browser automation AI. Return JSON {"workflow":[...]}.
Each step: {"id":"s1","action":"click|type|select|navigate|wait|scroll","target":"element text","selector":"css selector","value":"for type/select","description":"what this does"}
Use selectors exactly as listed. Extract real values from user goal.`;
  }

  private buildPrompt(request: AIRequest): string {
    const isAgent = request.mode === 'agent';
    let prompt = `Goal: ${request.prompt}\n\n`;

    if (request.completedSteps?.length) {
      prompt += `Already completed (DO NOT repeat these):\n${request.completedSteps.map((s, i) => `  ✓ ${i+1}. ${s}`).join('\n')}\n\n`;
    }

    if (request.pageContext) {
      prompt += `Page: ${request.pageContext.title} (${request.pageContext.url})\n`;
      const elements = (request.pageContext.elements ?? []).slice(0, 20);
      if (elements.length) {
        prompt += `Elements:\n`;
        elements.forEach((el, i) => {
          const t = (v: unknown) => v ? String(v).slice(0, 35) : '';
          const parts = [`${i+1}.[${el.type}]`];
          if (el.text)        parts.push(`text="${t(el.text)}"`);
          if (el.placeholder) parts.push(`ph="${t(el.placeholder)}"`);
          if (el.ariaLabel)   parts.push(`aria="${t(el.ariaLabel)}"`);
          if (el.selector)    parts.push(`sel="${t(el.selector)}"`);
          prompt += parts.join(' ') + '\n';
        });
      }
    }

    prompt += isAgent ? '\nReturn ONE next action JSON.' : '\nReturn full workflow JSON.';
    return prompt;
  }

  public enhancePrompt(p: string): string {
    const map: Record<string, string> = {
      'submit karo': 'submit the form', 'click karo': 'click on',
      'type karo': 'type in', 'select karo': 'select',
      'upload karo': 'upload the file', 'download karo': 'download the file',
    };
    let out = p.toLowerCase();
    for (const [k, v] of Object.entries(map)) out = out.replace(new RegExp(k, 'gi'), v);
    return out.charAt(0).toUpperCase() + out.slice(1);
  }

  private checkIfNotAutomation(prompt: string): string | null {
    const p = prompt.toLowerCase();
    const coding = ['solve','leetcode','hackerrank','algorithm','data structure','write code','binary tree','linked list','dynamic programming','big o','debug this','fix my code'];
    const question = ['what is','what are','how does','how do','why is','explain','define','difference between','who is','when was'];
    const automation = ['click','fill','type','enter','submit','navigate','go to','open','search','select','upload','download','scroll','form','create','login','sign in'];

    if (coding.some(k => p.includes(k)))
      return '⚠️ Orvicc automates browser tasks — it cannot solve coding problems.';
    if (question.some(k => p.includes(k)) && !automation.some(k => p.includes(k)))
      return '⚠️ Orvicc automates browser tasks — try e.g. "fill the login form and click Submit".';
    return null;
  }
}
