import type { PageContext, PageElement, FormInfo, TableInfo, ModalInfo } from '../types/workflow';

export class DOMAnalyzer {
  analyzePage(): PageContext {
    const elements = this.extractElements();
    const forms = this.extractForms(elements);
    const tables = this.extractTables();
    const modals = this.extractModals();

    return {
      url: window.location.href,
      title: document.title,
      elements,
      forms,
      tables,
      modals,
    };
  }

  private extractElements(): PageElement[] {
    const elements: PageElement[] = [];
    const selectorMap = new Map<string, PageElement>();

    // Extract inputs
    document.querySelectorAll('input, textarea, select').forEach((el) => {
      const element = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const pageElement = this.createPageElement(element, 'input');
      if (pageElement && !selectorMap.has(pageElement.selector)) {
        selectorMap.set(pageElement.selector, pageElement);
        elements.push(pageElement);
      }
    });

    // Extract buttons
    document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]').forEach((el) => {
      const element = el as HTMLButtonElement;
      const pageElement = this.createPageElement(element, 'button');
      if (pageElement && !selectorMap.has(pageElement.selector)) {
        selectorMap.set(pageElement.selector, pageElement);
        elements.push(pageElement);
      }
    });

    // Extract links
    document.querySelectorAll('a[href]').forEach((el) => {
      const element = el as HTMLAnchorElement;
      const pageElement = this.createPageElement(element, 'link');
      if (pageElement && !selectorMap.has(pageElement.selector)) {
        selectorMap.set(pageElement.selector, pageElement);
        elements.push(pageElement);
      }
    });

    // Extract headings
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
      const element = el as HTMLHeadingElement;
      const pageElement = this.createPageElement(element, 'heading');
      if (pageElement && !selectorMap.has(pageElement.selector)) {
        selectorMap.set(pageElement.selector, pageElement);
        elements.push(pageElement);
      }
    });

    return elements;
  }

  private createPageElement(element: HTMLElement, type: PageElement['type']): PageElement | null {
    const rect = element.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0 && 
                      element.offsetParent !== null &&
                      window.getComputedStyle(element).visibility !== 'hidden' &&
                      window.getComputedStyle(element).display !== 'none';

    if (!isVisible) return null;

    const selector = this.generateSelector(element);
    const text = element.textContent?.trim() || '';
    const placeholder = (element as any).placeholder || '';
    const ariaLabel = element.getAttribute('aria-label') || '';
    const id = element.id || '';
    const name = (element as any).name || '';
    const className = element.className || '';

    // Find associated label
    let label = '';
    if (id) {
      const labelElement = document.querySelector(`label[for="${id}"]`);
      if (labelElement) {
        label = labelElement.textContent?.trim() || '';
      }
    }

    const isClickable = type === 'button' || type === 'link' || 
                       (element as any).tagName === 'A' || 
                       (element as any).tagName === 'BUTTON';

    return {
      type,
      selector,
      text: text.substring(0, 100),
      placeholder: placeholder.substring(0, 50),
      label: label.substring(0, 50),
      ariaLabel: ariaLabel.substring(0, 50),
      id: id.substring(0, 50),
      name: name.substring(0, 50),
      className: className.substring(0, 100),
      visible: isVisible,
      clickable: isClickable,
    };
  }

  private generateSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }

    const path: string[] = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${CSS.escape(current.id)}`;
        path.unshift(selector);
        break;
      }

      // Skip Tailwind utility classes that contain ':', '/', '[', ']'
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

  private extractForms(elements: PageElement[]): FormInfo[] {
    const forms: FormInfo[] = [];
    document.querySelectorAll('form').forEach((form) => {
      const formElement = form as HTMLFormElement;
      const selector = this.generateSelector(formElement);
      const fields = elements.filter(el => 
        formElement.contains(document.querySelector(el.selector))
      );
      
      const submitButton = elements.find(el => 
        el.type === 'button' && 
        (el.text?.toLowerCase().includes('submit') || 
         el.text?.toLowerCase().includes('save') ||
         el.ariaLabel?.toLowerCase().includes('submit'))
      );

      if (fields.length > 0) {
        forms.push({
          selector,
          fields,
          submitButton,
        });
      }
    });
    return forms;
  }

  private extractTables(): TableInfo[] {
    const tables: TableInfo[] = [];
    document.querySelectorAll('table').forEach((table) => {
      const selector = this.generateSelector(table);
      const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
      const rows = table.querySelectorAll('tbody tr');
      
      if (headers.length > 0 && rows.length > 0) {
        tables.push({
          selector,
          headers,
          rowCount: rows.length,
        });
      }
    });
    return tables;
  }

  private extractModals(): ModalInfo[] {
    const modals: ModalInfo[] = [];
    const modalSelectors = [
      '[role="dialog"]',
      '.modal',
      '.popup',
      '[aria-modal="true"]',
    ];

    modalSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach((modal) => {
        const modalElement = modal as HTMLElement;
        const isOpen = modalElement.offsetParent !== null;
        const title = modalElement.querySelector('h1, h2, h3, [role="heading"]')?.textContent?.trim() || '';
        const buttons = Array.from(modalElement.querySelectorAll('button')).map(btn => {
          const btnElement = btn as HTMLButtonElement;
          return this.createPageElement(btnElement, 'button');
        }).filter(Boolean) as PageElement[];

        if (isOpen) {
          modals.push({
            selector: this.generateSelector(modalElement),
            title: title.substring(0, 50),
            buttons,
            isOpen,
          });
        }
      });
    });

    return modals;
  }
}
