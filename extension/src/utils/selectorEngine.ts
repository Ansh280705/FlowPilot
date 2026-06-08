import type { SelectorMatch, PageElement } from '../types/workflow';

export class SelectorEngine {
  findElement(target: string, context?: PageElement[]): SelectorMatch | null {
    const searchContext = context || this.getAllElements();
    
    // Try different matching strategies in order of reliability
    const strategies = [
      this.byExactText,
      this.byPartialText,
      this.byPlaceholder,
      this.byLabel,
      this.byAriaLabel,
      this.byId,
      this.byName,
      this.byClassName,
    ];

    for (const strategy of strategies) {
      const match = strategy.call(this, target, searchContext);
      if (match && match.confidence > 0.7) {
        return match;
      }
    }

    return null;
  }

  private getAllElements(): PageElement[] {
    const elements: PageElement[] = [];
    
    document.querySelectorAll('*').forEach((el) => {
      const htmlEl = el as HTMLElement;
      const rect = htmlEl.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;

      if (isVisible) {
        elements.push({
          type: this.getElementType(htmlEl),
          selector: this.generateSelector(htmlEl),
          text: htmlEl.textContent?.trim().substring(0, 100) || '',
          placeholder: (htmlEl as any).placeholder?.substring(0, 50) || '',
          label: '',
          ariaLabel: htmlEl.getAttribute('aria-label')?.substring(0, 50) || '',
          id: htmlEl.id?.substring(0, 50) || '',
          name: (htmlEl as any).name?.substring(0, 50) || '',
          className: htmlEl.className?.substring(0, 100) || '',
          visible: isVisible,
          clickable: this.isClickable(htmlEl),
        });
      }
    });

    return elements;
  }

  private getElementType(el: HTMLElement): PageElement['type'] {
    const tagName = el.tagName.toLowerCase();

    if (tagName === 'input' || tagName === 'textarea') {
      return 'input';
    }
    if (tagName === 'select') {
      return 'select';
    }
    if (tagName === 'button' || el.getAttribute('role') === 'button') {
      return 'button';
    }
    if (tagName === 'a') {
      return 'link';
    }
    if (tagName === 'img') {
      return 'image';
    }
    if (tagName === 'ul' || tagName === 'ol' || tagName === 'li') {
      return 'list';
    }
    if (tagName.match(/^h[1-6]$/)) {
      return 'heading';
    }

    return 'button';
  }

  private isClickable(el: HTMLElement): boolean {
    const style = window.getComputedStyle(el);
    const tagName = el.tagName.toLowerCase();
    
    return (
      tagName === 'button' ||
      tagName === 'a' ||
      tagName === 'input' && (el as any).type === 'submit' ||
      el.getAttribute('role') === 'button' ||
      style.cursor === 'pointer' ||
      el.onclick !== null
    );
  }

  public generateSelector(el: HTMLElement): string {
    if (el.id) {
      return `#${CSS.escape(el.id)}`;
    }

    const path: string[] = [];
    let current = el;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${CSS.escape(current.id)}`;
        path.unshift(selector);
        break;
      }

      // Skip Tailwind utility classes — they contain ':', '/', '[', ']'
      // Only use classes that look like stable component/BEM identifiers
      if (current.className && typeof current.className === 'string') {
        const safeClass = current.className
          .split(' ')
          .map(c => c.trim())
          .find(c =>
            c.length > 0 &&
            !c.includes(':') &&
            !c.includes('/') &&
            !c.includes('[') &&
            !c.includes(']') &&
            !c.includes('(')
          );
        if (safeClass) {
          selector += `.${CSS.escape(safeClass)}`;
        }
      }

      const siblings = Array.from(current.parentElement?.children || []);
      const index = siblings.indexOf(current);
      if (siblings.length > 1 && index > 0) {
        selector += `:nth-child(${index + 1})`;
      }

      path.unshift(selector);
      current = current.parentElement as HTMLElement;
    }

    return path.join(' > ');
  }

  private byExactText(target: string, elements: PageElement[]): SelectorMatch | null {
    const normalizedTarget = target.toLowerCase().trim();
    
    for (const el of elements) {
      if (el.text?.toLowerCase() === normalizedTarget) {
        const element = document.querySelector(el.selector);
        if (element) {
          return {
            selector: el.selector,
            type: 'text',
            confidence: 0.95,
            element,
          };
        }
      }
    }

    return null;
  }

  private byPartialText(target: string, elements: PageElement[]): SelectorMatch | null {
    const normalizedTarget = target.toLowerCase().trim();
    
    for (const el of elements) {
      if (el.text?.toLowerCase().includes(normalizedTarget)) {
        const element = document.querySelector(el.selector);
        if (element) {
          const confidence = el.text.toLowerCase() === normalizedTarget ? 0.9 : 0.8;
          return {
            selector: el.selector,
            type: 'text',
            confidence,
            element,
          };
        }
      }
    }

    return null;
  }

  private byPlaceholder(target: string, elements: PageElement[]): SelectorMatch | null {
    const normalizedTarget = target.toLowerCase().trim();
    
    for (const el of elements) {
      if (el.placeholder?.toLowerCase().includes(normalizedTarget)) {
        const element = document.querySelector(el.selector);
        if (element) {
          return {
            selector: el.selector,
            type: 'placeholder',
            confidence: 0.85,
            element,
          };
        }
      }
    }

    return null;
  }

  private byLabel(target: string, elements: PageElement[]): SelectorMatch | null {
    const normalizedTarget = target.toLowerCase().trim();
    
    for (const el of elements) {
      if (el.label?.toLowerCase().includes(normalizedTarget)) {
        const element = document.querySelector(el.selector);
        if (element) {
          return {
            selector: el.selector,
            type: 'label',
            confidence: 0.85,
            element,
          };
        }
      }
    }

    return null;
  }

  private byAriaLabel(target: string, elements: PageElement[]): SelectorMatch | null {
    const normalizedTarget = target.toLowerCase().trim();
    
    for (const el of elements) {
      if (el.ariaLabel?.toLowerCase().includes(normalizedTarget)) {
        const element = document.querySelector(el.selector);
        if (element) {
          return {
            selector: el.selector,
            type: 'aria',
            confidence: 0.9,
            element,
          };
        }
      }
    }

    return null;
  }

  private byId(target: string, elements: PageElement[]): SelectorMatch | null {
    for (const el of elements) {
      if (el.id?.toLowerCase() === target.toLowerCase()) {
        const element = document.querySelector(el.selector);
        if (element) {
          return {
            selector: el.selector,
            type: 'css',
            confidence: 0.95,
            element,
          };
        }
      }
    }

    return null;
  }

  private byName(target: string, elements: PageElement[]): SelectorMatch | null {
    for (const el of elements) {
      if (el.name?.toLowerCase() === target.toLowerCase()) {
        const element = document.querySelector(el.selector);
        if (element) {
          return {
            selector: el.selector,
            type: 'css',
            confidence: 0.85,
            element,
          };
        }
      }
    }

    return null;
  }

  private byClassName(target: string, elements: PageElement[]): SelectorMatch | null {
    for (const el of elements) {
      if (el.className?.toLowerCase().includes(target.toLowerCase())) {
        const element = document.querySelector(el.selector);
        if (element) {
          return {
            selector: el.selector,
            type: 'css',
            confidence: 0.7,
            element,
          };
        }
      }
    }

    return null;
  }

  // Self-healing: try alternative selectors if primary fails
  findAlternativeSelector(originalSelector: string): string | null {
    try {
      const element = document.querySelector(originalSelector);
      if (element) return originalSelector;

      // Try by ID
      if (originalSelector.includes('#')) {
        const idMatch = originalSelector.match(/#([^ >]+)/);
        if (idMatch) {
          const altElement = document.getElementById(idMatch[1]);
          if (altElement) return `#${idMatch[1]}`;
        }
      }

      // Try by class
      if (originalSelector.includes('.')) {
        const classMatch = originalSelector.match(/\.([^ >]+)/);
        if (classMatch) {
          const altElements = document.getElementsByClassName(classMatch[1]);
          if (altElements.length > 0) {
            return `.${classMatch[1]}`;
          }
        }
      }

      // Try by tag
      const tagMatch = originalSelector.match(/^([a-z]+)/i);
      if (tagMatch) {
        const altElements = document.getElementsByTagName(tagMatch[1]);
        if (altElements.length === 1) {
          return tagMatch[1];
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}
