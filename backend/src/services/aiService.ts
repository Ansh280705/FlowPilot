import 'dotenv/config';
import Groq from 'groq-sdk';
import type { AIRequest, AIResponse, WorkflowStep } from '../../../shared/types/workflow';

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

    try {
      const prompt = this.buildPrompt(request);

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert browser automation AI. Your task is to convert natural language instructions into structured browser automation workflows.

You MUST respond with ONLY valid JSON. No markdown, no explanations, no additional text.

The workflow JSON should be an array of steps. Each step has:
- id: unique string identifier
- action: one of "click", "type", "select", "wait", "scroll", "hover", "upload", "extract", "navigate", "pressKey", "conditional"
- target: description of the target element (for click, type, select, etc.)
- value: value to type or select (for type, select, etc.)
- selector: CSS selector if known
- selectorType: "css", "xpath", "text", "aria", "placeholder", "label"
- waitTime: milliseconds to wait after action (optional)
- waitForSelector: selector to wait for (optional)
- description: human-readable description of the step

Example response format:
[
  {
    "id": "step-1",
    "action": "type",
    "target": "patient name",
    "value": "{{name}}",
    "selectorType": "label",
    "description": "Type patient name in the name field"
  },
  {
    "id": "step-2",
    "action": "click",
    "target": "Finalize",
    "selectorType": "text",
    "description": "Click the Finalize button"
  }
]`,
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
      const parsed = JSON.parse(content);

      // Extract workflow array if it's nested
      const workflow = parsed.workflow || parsed.steps || parsed;

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
      prompt += `Page Information:\n`;
      prompt += `- URL: ${request.pageContext.url}\n`;
      prompt += `- Title: ${request.pageContext.title}\n\n`;

      if (request.pageContext.elements && request.pageContext.elements.length > 0) {
        prompt += `Available Elements:\n`;
        request.pageContext.elements.slice(0, 50).forEach((el, i) => {
          prompt += `${i + 1}. ${el.type}: ${el.text || el.placeholder || el.label || el.ariaLabel || 'unnamed'}\n`;
        });
        prompt += '\n';
      }

      if (request.pageContext.forms && request.pageContext.forms.length > 0) {
        prompt += `Forms:\n`;
        request.pageContext.forms.forEach((form, i) => {
          prompt += `${i + 1}. Form with ${form.fields.length} fields\n`;
        });
        prompt += '\n';
      }
    }

    if (request.variables) {
      prompt += `Available Variables:\n`;
      Object.entries(request.variables).forEach(([key, value]) => {
        prompt += `- {{${key}}}: ${value}\n`;
      });
      prompt += '\n';
    }

    prompt += `Generate a workflow to accomplish the user's request using the available elements. Use {{variable}} syntax for dynamic values.`;

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
}
