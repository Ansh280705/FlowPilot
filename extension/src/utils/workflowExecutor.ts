import { SelectorEngine } from './selectorEngine';
import type { WorkflowStep } from '../types/workflow';

export class WorkflowExecutor {
  private selectorEngine: SelectorEngine;

  constructor(selectorEngine: SelectorEngine) {
    this.selectorEngine = selectorEngine;
  }

  async executeStep(step: WorkflowStep, variables: Record<string, string> = {}): Promise<any> {
    
    try {
      // Replace variables in values
      const processedValue = this.replaceVariables(step.value || '', variables);
      const processedTarget = this.replaceVariables(step.target || '', variables);

      switch (step.action) {
        case 'click':
          return await this.click(processedTarget, step);
        
        case 'type':
          return await this.type(processedTarget, processedValue, step);
        
        case 'select':
          return await this.select(processedTarget, processedValue, step);
        
        case 'wait':
          return await this.wait(step.waitTime || 1000);
        
        case 'scroll':
          return await this.scroll(step);
        
        case 'hover':
          return await this.hover(processedTarget, step);
        
        case 'upload':
          return await this.upload(processedTarget, processedValue, step);
        
        case 'extract':
          return await this.extract(processedTarget, step);
        
        case 'navigate':
          return await this.navigate(processedValue);
        
        case 'pressKey':
          return await this.pressKey(processedValue, step);
        
        case 'conditional':
          return await this.conditional(step, variables);
        
        default:
          throw new Error(`Unknown action: ${step.action}`);
      }
    } catch (error) {
      // Retry logic
      if (step.retryCount && step.retryCount > 0) {
        await this.wait(1000);
        step.retryCount--;
        return this.executeStep(step, variables);
      }
      throw error;
    }
  }

  private replaceVariables(value: string, variables: Record<string, string>): string {
    let result = value;
    for (const [key, val] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), val);
    }
    return result;
  }

  private async click(target: string, step: WorkflowStep): Promise<void> {
    const match = this.findElement(target, step.selector);
    if (!match || !match.element) {
      throw new Error(`Element not found: ${target}`);
    }

    const element = match.element as HTMLElement;
    
    // Wait for element to be clickable
    await this.waitForElement(element);
    
    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this.wait(200);

    // Click the element
    element.click();
    await this.wait(step.waitTime || 500);
  }

  private async type(target: string, value: string, step: WorkflowStep): Promise<void> {
    const match = this.findElement(target, step.selector);
    if (!match || !match.element) {
      throw new Error(`Element not found: ${target}`);
    }

    const element = match.element as HTMLInputElement | HTMLTextAreaElement;

    // Wait for element to be editable
    await this.waitForElement(element);

    // Focus element
    element.focus();
    await this.wait(100);

    // Use React's internal setter if available (handles controlled components)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      element instanceof HTMLTextAreaElement
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
    } else {
      element.value = value;
    }

    // Fire all events frameworks listen to
    element.dispatchEvent(new Event('input',  { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown',  { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup',    { bubbles: true }));

    await this.wait(step.waitTime || 200);
  }

  private async select(target: string, value: string, step: WorkflowStep): Promise<void> {
    const match = this.findElement(target, step.selector);
    if (!match || !match.element) {
      throw new Error(`Element not found: ${target}`);
    }

    const element = match.element as HTMLSelectElement;
    
    // Find option by text or value
    let option: HTMLOptionElement | null = null;
    for (const opt of element.options) {
      if (opt.text === value || opt.value === value) {
        option = opt;
        break;
      }
    }

    if (!option) {
      throw new Error(`Option not found: ${value}`);
    }

    element.value = option.value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    await this.wait(step.waitTime || 200);
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async scroll(step: WorkflowStep): Promise<void> {
    if (step.target) {
      const match = this.findElement(step.target, step.selector);
      if (match && match.element) {
        match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
    await this.wait(step.waitTime || 500);
  }

  private async hover(target: string, step: WorkflowStep): Promise<void> {
    const match = this.findElement(target, step.selector);
    if (!match || !match.element) {
      throw new Error(`Element not found: ${target}`);
    }

    const element = match.element as HTMLElement;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    const event = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    element.dispatchEvent(event);
    
    await this.wait(step.waitTime || 300);
  }

  private async upload(target: string, _filePath: string, step: WorkflowStep): Promise<void> {
    const match = this.findElement(target, step.selector);
    if (!match || !match.element) {
      throw new Error(`Element not found: ${target}`);
    }

    // Note: File upload from content script is limited
    // This would typically require user interaction or a file input
    console.warn('File upload requires user interaction or file system access');

    await this.wait(step.waitTime || 200);
  }

  private async extract(target: string, step: WorkflowStep): Promise<string> {
    const match = this.findElement(target, step.selector);
    if (!match || !match.element) {
      throw new Error(`Element not found: ${target}`);
    }

    const element = match.element as HTMLElement;
    return element.textContent?.trim() || element.getAttribute('value') || '';
  }

  private async navigate(url: string): Promise<void> {
    window.location.href = url;
    await this.wait(2000);
  }

  private async pressKey(key: string, step: WorkflowStep): Promise<void> {
    const event = new KeyboardEvent('keydown', {
      key: key,
      code: key,
      bubbles: true,
      cancelable: true,
    });
    document.activeElement?.dispatchEvent(event);
    await this.wait(step.waitTime || 100);
  }

  private async conditional(step: WorkflowStep, variables: Record<string, string>): Promise<any> {
    if (!step.condition) {
      throw new Error('Conditional step requires condition');
    }

    const conditionMet = this.evaluateCondition(step.condition);
    
    if (conditionMet && step.then) {
      for (const thenStep of step.then) {
        await this.executeStep(thenStep, variables);
      }
    } else if (!conditionMet && step.else) {
      for (const elseStep of step.else) {
        await this.executeStep(elseStep, variables);
      }
    }
  }

  private evaluateCondition(condition: any): boolean {
    const element = document.querySelector(condition.target);
    if (!element) return false;

    switch (condition.type) {
      case 'elementExists':
        return true;
      
      case 'elementVisible':
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      
      case 'textContains':
        return element.textContent?.includes(condition.value) || false;
      
      case 'valueEquals':
        return (element as any).value === condition.value;
      
      default:
        return false;
    }
  }

  private findElement(target: string, selector?: string): any {
    // 1. Try the explicit CSS selector first — wrap in try/catch for invalid selectors
    if (selector) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          return { selector, element, type: 'css', confidence: 1 };
        }
      } catch {
        // Invalid selector (e.g. Tailwind classes with colons) — fall through
      }

      // Self-healing fallback
      try {
        const altSelector = this.selectorEngine.findAlternativeSelector(selector);
        if (altSelector) {
          const altElement = document.querySelector(altSelector);
          if (altElement) {
            return { selector: altSelector, element: altElement, type: 'css', confidence: 0.8 };
          }
        }
      } catch {
        // ignore
      }
    }

    // 2. Try the selectorEngine (text/placeholder/aria/label matching)
    const engineMatch = this.selectorEngine.findElement(target);
    if (engineMatch) return engineMatch;

    // 3. Broad fuzzy fallback — scan all inputs/buttons directly
    const needle = target.toLowerCase().replace(/[^a-z0-9]/g, '');
    const candidates = Array.from(
      document.querySelectorAll('input, textarea, select, button, [role="button"]')
    ) as HTMLElement[];

    for (const el of candidates) {
      const attrs = [
        (el as HTMLInputElement).placeholder,
        el.getAttribute('aria-label'),
        el.getAttribute('name'),
        el.id,
        el.textContent,
        // associated label
        el.id ? document.querySelector(`label[for="${el.id}"]`)?.textContent : '',
      ];
      for (const attr of attrs) {
        if (!attr) continue;
        const hay = attr.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (hay.includes(needle) || needle.includes(hay.slice(0, Math.max(4, needle.length - 2)))) {
          return {
            selector: this.selectorEngine.generateSelector(el),
            element: el,
            type: 'fuzzy',
            confidence: 0.7,
          };
        }
      }
    }

    return null;
  }

  private async waitForElement(element: HTMLElement, timeout = 10000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && 
                        element.offsetParent !== null;
      
      if (isVisible) return;
      
      await this.wait(100);
    }
    
    throw new Error('Element not visible within timeout');
  }
}
