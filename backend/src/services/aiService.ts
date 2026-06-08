import Groq from 'groq-sdk';
import type { AIRequest, AIResponse, WorkflowStep } from '../types/workflow';

let groq: Groq | null = null;

if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
} else {
  console.warn('GROQ_API_KEY not set, AI features will be disabled');
}

export class AIService {
  async generateWorkflow(request: AIRequest): Promise<AIResponse> {
    if (!groq) {
      throw new Error('GROQ_API_KEY not configured. Please set the environment variable to use AI features.');
    }

    // Detect non-automation intents and reject early
    const notAutomationMessage = this.checkIfNotAutomation(request.prompt);
    if (notAutomationMessage) {
      return {
        enhancedPrompt: request.prompt,
        workflow: [],
        reasoning: notAutomationMessage,
        confidence: 0,
      };
    }

    try {
      const prompt = this.buildPrompt(request);

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert browser automation AI. Convert natural language instructions into structured browser automation workflows.

CRITICAL RULES:
1. Respond with ONLY valid JSON — no markdown, no explanation, no extra text.
2. The response must be a JSON object with a "workflow" key containing an array of steps.
3. Every "type" step MUST have a concrete "value" extracted from the user's prompt. NEVER use placeholder text like "type name here" or "enter value". If the user says "name is John", value must be "John".
4. Use {{variable}} syntax ONLY when the user explicitly defines a variable name.

Step schema:
- id: unique string
- action: "click" | "type" | "select" | "wait" | "scroll" | "navigate" | "pressKey"
- target: description of the element (e.g. "Customer Name input", "Book Appointment button")
- value: the ACTUAL value to type or select (required for type/select actions)
- selector: CSS selector if known
- selectorType: "css" | "placeholder" | "label" | "text" | "aria"
- description: plain English summary of what this step does

Example — user says "fill name as Rahul, phone 919876543210, date 06/15/2026 10:30 AM":
{
  "workflow": [
    {"id":"s1","action":"type","target":"Customer Name","value":"Rahul","selectorType":"placeholder","description":"Type Rahul in the Customer Name field"},
    {"id":"s2","action":"type","target":"Phone Number","value":"919876543210","selectorType":"placeholder","description":"Type phone number"},
    {"id":"s3","action":"type","target":"Date & Time","value":"06/15/2026 10:30 AM","selectorType":"placeholder","description":"Enter date and time"},
    {"id":"s4","action":"click","target":"Book Appointment","selectorType":"text","description":"Click Book Appointment button"}
  ]
}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        // Sometimes the model wraps in markdown — strip it
        const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      // Handle { workflow: [...] }, { steps: [...] }, or bare array
      const workflow: WorkflowStep[] = parsed.workflow ?? parsed.steps ?? (Array.isArray(parsed) ? parsed : []);

      return {
        enhancedPrompt: this.enhancePrompt(request.prompt),
        workflow: Array.isArray(workflow) ? workflow : [],
        reasoning: parsed.reasoning || '',
        confidence: 0.85,
      };
    } catch (error) {
      console.error('Error generating workflow:', error);
      throw new Error('Failed to generate workflow');
    }
  }

  private buildPrompt(request: AIRequest): string {
    let prompt = `User Request: ${request.prompt}\n\n`;

    if (request.pageContext) {
      prompt += `Page: ${request.pageContext.title} (${request.pageContext.url})\n\n`;

      if (request.pageContext.elements && request.pageContext.elements.length > 0) {
        // Cap at 40 elements and truncate long text to keep payload small
        const elements = request.pageContext.elements.slice(0, 40);
        prompt += `EXACT page elements (use these to pick selectors and targets):\n`;
        elements.forEach((el: Record<string, any>, _i: number) => {
          const parts: string[] = [`${_i + 1}. [${el.type}]`];
          if (el.placeholder) parts.push(`placeholder="${el.placeholder.slice(0, 40)}"`);
          if (el.label)       parts.push(`label="${el.label.slice(0, 40)}"`);
          if (el.ariaLabel)   parts.push(`aria-label="${el.ariaLabel.slice(0, 40)}"`);
          if (el.text)        parts.push(`text="${el.text.slice(0, 40)}"`);
          if (el.id)          parts.push(`id="${el.id}"`);
          if (el.name)        parts.push(`name="${el.name}"`);
          if (el.selector)    parts.push(`selector="${el.selector}"`);
          prompt += parts.join(' ') + '\n';
        });
        prompt += '\n';
        prompt += `IMPORTANT: For each step, set "selector" to the exact CSS selector shown above, and set "target" to the placeholder/label text shown above. This ensures reliable element matching.\n\n`;
      }
    }

    if (request.variables) {
      prompt += `Variables:\n`;
      Object.entries(request.variables).forEach(([key, value]) => {
        prompt += `  {{${key}}} = ${value}\n`;
      });
      prompt += '\n';
    }

    prompt += `Now generate the workflow JSON object with a "workflow" array.`;
    return prompt;
  }

  public enhancePrompt(originalPrompt: string): string {
    // Basic prompt enhancement
    const enhancements: Record<string, string> = {
      'patient bharna': 'Fill patient details form',
      'finalize bhi': 'and click finalize button',
      'submit karo': 'submit the form',
      'upload karo': 'upload the file',
      'download karo': 'download the file',
      'click karo': 'click on',
      'type karo': 'type in',
      'select karo': 'select',
    };

    let enhanced = originalPrompt.toLowerCase();
    for (const [key, value] of Object.entries(enhancements)) {
      enhanced = enhanced.replace(new RegExp(key, 'gi'), value);
    }

    // Capitalize first letter
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);

    return enhanced;
  }

  private checkIfNotAutomation(prompt: string): string | null {
    const p = prompt.toLowerCase();

    const codingKeywords = [
      'solve', 'leetcode', 'hackerrank', 'codeforces', 'algorithm', 'data structure',
      'write code', 'write a program', 'code for', 'implement', 'binary tree', 'linked list',
      'dynamic programming', 'recursion', 'sorting', 'graph problem', 'complexity',
      'time complexity', 'space complexity', 'big o', 'write function', 'debug this',
      'fix my code', 'explain this code', 'what does this code',
    ];

    const questionKeywords = [
      'what is', 'what are', 'how does', 'how do', 'why is', 'why does',
      'explain', 'define', 'difference between', 'tell me about',
      'who is', 'when was', 'where is',
    ];

    const automationKeywords = [
      'click', 'fill', 'type', 'enter', 'submit', 'navigate', 'go to',
      'open', 'search', 'select', 'upload', 'download', 'scroll', 'form',
    ];

    const isCoding = codingKeywords.some(k => p.includes(k));
    const isQuestion = questionKeywords.some(k => p.includes(k));
    const hasAutomationIntent = automationKeywords.some(k => p.includes(k));

    if (isCoding) {
      return (
        '⚠️ FlowPilot AI is a browser automation tool — it clicks buttons, fills forms, and navigates pages. ' +
        'It cannot solve coding problems or write algorithms. ' +
        'For this, try ChatGPT, Claude, or Gemini.'
      );
    }

    if (isQuestion && !hasAutomationIntent) {
      return (
        '⚠️ FlowPilot AI is a browser automation tool — it cannot answer questions or explain concepts. ' +
        'Try asking it to automate a task instead, e.g. "fill the login form with email test@example.com and click Submit".'
      );
    }

    return null;
  }
}
