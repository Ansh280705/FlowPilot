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
        
        case 'paste':
          return await this.paste(processedValue, step);
        
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
    const element = await this.waitForTargetElement(target, step);
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    element.click();
    await this.wait(step.waitTime || 500);
  }

  private async type(target: string, value: string, step: WorkflowStep): Promise<void> {
    const element = await this.waitForTargetElement(target, step) as HTMLInputElement | HTMLTextAreaElement;

    // Focus element
    element.focus();
    await this.wait(100);

    // Use React's internal setter to bypass controlled component tracking
    // Must get descriptor from the actual prototype of the element instance
    const proto = element instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;

    // Only use native setter if the element actually inherits from that prototype
    const nativeValueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    const isCorrectProto = element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement;

    if (nativeValueSetter && isCorrectProto) {
      nativeValueSetter.call(element, value);
    } else {
      (element as HTMLInputElement).value = value;
    }

    // Fire all events frameworks (React, Vue, Angular) listen to
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

  private findElement(target: string, selector?: string, visibleOnly = false): any {
    const pickVisible = (element: Element | null) => {
      if (!element) return null;
      const htmlEl = element as HTMLElement;
      if (visibleOnly && !this.isElementVisible(htmlEl)) return null;
      return htmlEl;
    };

    // Text match on visible menu items / links (critical for GitHub dropdowns)
    const textMatch = this.findByVisibleText(target);
    if (textMatch) {
      return {
        selector: this.selectorEngine.generateSelector(textMatch),
        element: textMatch,
        type: 'text',
        confidence: 0.95,
      };
    }

    // Known high-confidence selectors for common flows
    for (const knownSelector of this.getKnownSelectors(target)) {
      const element = this.queryFirstVisible(knownSelector);
      if (element) {
        return { selector: knownSelector, element, type: 'css', confidence: 1 };
      }
    }

    // 1. Try the explicit CSS selector first — wrap in try/catch for invalid selectors
    if (selector) {
      try {
        const matches = Array.from(document.querySelectorAll(selector));
        const element = pickVisible(matches.find(el => this.isElementVisible(el as HTMLElement)) ?? matches[0] ?? null);
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
          const element = pickVisible(document.querySelector(altSelector));
          if (element) {
            return { selector: altSelector, element, type: 'css', confidence: 0.8 };
          }
        }
      } catch {
        // ignore
      }
    }

    // 2. Try the selectorEngine (text/placeholder/aria/label matching)
    const engineMatch = this.selectorEngine.findElement(target);
    if (engineMatch?.element && (!visibleOnly || this.isElementVisible(engineMatch.element as HTMLElement))) {
      return engineMatch;
    }

    // 3. Broad fuzzy fallback — scan all inputs/buttons directly
    const needle = target.toLowerCase().replace(/[^a-z0-9]/g, '');
    const candidates = Array.from(
      document.querySelectorAll('a, input, textarea, select, button, [role="button"], [role="menuitem"], [role="textbox"]')
    ) as HTMLElement[];

    for (const el of candidates) {
      if (visibleOnly && !this.isElementVisible(el)) continue;

      const attrs = [
        (el as HTMLInputElement).placeholder,
        el.getAttribute('aria-label'),
        el.getAttribute('name'),
        el.id,
        el.textContent,
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

  private getKnownSelectors(target: string): string[] {
    const t = target.toLowerCase();
    if (t.includes('repository name') || t === 'repository name') {
      return ['#repository_name', 'input[name="repository[name]"]', '[data-testid="repository-name-input"]'];
    }
    if (t.includes('create repository')) {
      return [
        'button[data-testid="create-repository-button"]',
        'form button[type="submit"]',
        '.js-repo-create-submit',
      ];
    }
    if (t === 'new' || t.includes('new menu')) {
      return ['[aria-label="Create something new"]', '[data-testid="create-menu-button"]'];
    }
    if (t.includes('new repository')) {
      return [
        '[data-testid="create-new-repository"]',
        'a[href="/new"]',
        'a[href*="/new"]',
        '[role="menuitem"] a[href="/new"]',
      ];
    }
    return [];
  }

  private queryFirstVisible(selector: string): HTMLElement | null {
    const matches = Array.from(document.querySelectorAll(selector));
    for (const el of matches) {
      if (this.isElementVisible(el as HTMLElement)) return el as HTMLElement;
    }
    return null;
  }

  private findByVisibleText(target: string): HTMLElement | null {
    const normalized = target.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!normalized) return null;

    const candidates = Array.from(
      document.querySelectorAll('a, button, [role="menuitem"], [role="button"], [role="link"]')
    );

    for (const el of candidates) {
      const text = el.textContent?.trim().toLowerCase().replace(/\s+/g, ' ') || '';
      if (text !== normalized && !text.includes(normalized) && !normalized.includes(text)) continue;

      const clickable = (el.closest('a, button, [role="menuitem"], [role="button"]') ?? el) as HTMLElement;
      if (this.isElementVisible(clickable)) return clickable;
    }

    return null;
  }

  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }

    // offsetParent is null for fixed/sticky elements — don't use as sole visibility signal
    return true;
  }

  private async waitForTargetElement(target: string, step: WorkflowStep, timeout = 12000): Promise<HTMLElement> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const match = this.findElement(target, step.selector, true)
        ?? this.findElement(target, step.selector, false);

      if (match?.element) {
        const element = match.element as HTMLElement;
        if (this.isElementVisible(element)) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await this.wait(200);
          return element;
        }
      }

      await this.wait(200);
    }

    throw new Error(`Element not visible within timeout: ${target}`);
  }

  private async paste(value: string, step: WorkflowStep): Promise<void> {
    if (step.target) {
      const element = await this.waitForTargetElement(step.target, step);
      element.focus();
    }

    const activeEl = document.activeElement || document.body;
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', value);

    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: clipboardData
    });
    activeEl.dispatchEvent(pasteEvent);

    await this.wait(step.waitTime || 500);
  }
}
