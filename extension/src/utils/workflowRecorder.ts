import { SelectorEngine } from './selectorEngine';
import type { WorkflowStep } from '../types/workflow';

export class WorkflowRecorder {
  private selectorEngine: SelectorEngine;
  private isRecording: boolean = false;
  private recordedSteps: WorkflowStep[] = [];
  private lastActionTime: number = 0;

  constructor(selectorEngine: SelectorEngine) {
    this.selectorEngine = selectorEngine;
  }

  initialize(): void {
    // Add event listeners for recording
    this.addEventListeners();
  }

  start(): void {
    this.isRecording = true;
    this.recordedSteps = [];
    this.lastActionTime = Date.now();
    console.log('Recording started');
  }

  stop(): WorkflowStep[] {
    this.isRecording = false;
    console.log('Recording stopped, steps:', this.recordedSteps.length);
    return [...this.recordedSteps];
  }

  private addEventListeners(): void {
    // Click events
    document.addEventListener('click', this.handleClick.bind(this), true);
    
    // Input events
    document.addEventListener('input', this.handleInput.bind(this), true);
    
    // Change events (for selects)
    document.addEventListener('change', this.handleChange.bind(this), true);
    
    // Scroll events
    document.addEventListener('scroll', this.handleScroll.bind(this), true);
  }

  private handleClick(event: MouseEvent): void {
    if (!this.isRecording) return;

    const target = event.target as HTMLElement;
    if (!this.isValidTarget(target)) return;

    const selector = this.selectorEngine.generateSelector(target);
    const text = target.textContent?.trim().substring(0, 100) || '';
    const ariaLabel = target.getAttribute('aria-label')?.substring(0, 50) || '';

    this.recordStep({
      id: crypto.randomUUID(),
      action: 'click',
      target: text || ariaLabel || selector,
      selector,
      selectorType: 'css',
      description: `Click on ${text || ariaLabel || 'element'}`,
    });
  }

  private handleInput(event: Event): void {
    if (!this.isRecording) return;

    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!this.isValidTarget(target)) return;

    const selector = this.selectorEngine.generateSelector(target);
    const placeholder = target.placeholder?.substring(0, 50) || '';
    const label = this.findLabel(target);
    const value = target.value;

    // Debounce rapid typing
    const now = Date.now();
    if (now - this.lastActionTime < 500) {
      // Update last step instead of adding new one
      const lastStep = this.recordedSteps[this.recordedSteps.length - 1];
      if (lastStep && lastStep.action === 'type' && lastStep.selector === selector) {
        lastStep.value = value;
        return;
      }
    }

    this.recordStep({
      id: crypto.randomUUID(),
      action: 'type',
      target: label || placeholder || selector,
      value,
      selector,
      selectorType: 'css',
      description: `Type in ${label || placeholder || 'input field'}`,
    });

    this.lastActionTime = now;
  }

  private handleChange(event: Event): void {
    if (!this.isRecording) return;

    const target = event.target as HTMLSelectElement;
    if (!this.isValidTarget(target)) return;

    const selector = this.selectorEngine.generateSelector(target);
    const label = this.findLabel(target);
    const selectedOption = target.options[target.selectedIndex];
    const value = selectedOption?.text || selectedOption?.value || '';

    this.recordStep({
      id: crypto.randomUUID(),
      action: 'select',
      target: label || selector,
      value,
      selector,
      selectorType: 'css',
      description: `Select ${value} from ${label || 'dropdown'}`,
    });
  }

  private handleScroll(_event: Event): void {
    if (!this.isRecording) return;

    // Debounce scroll events
    const now = Date.now();
    if (now - this.lastActionTime < 1000) return;

    this.recordStep({
      id: crypto.randomUUID(),
      action: 'scroll',
      description: 'Scroll page',
    });

    this.lastActionTime = now;
  }

  private isValidTarget(target: HTMLElement): boolean {
    // Ignore elements that are part of the extension UI
    if (target.closest('[data-Orvicc-ui]')) return false;
    
    // Ignore hidden elements
    const rect = target.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    
    // Ignore elements with certain classes
    if (target.classList.contains('Orvicc-ignore')) return false;

    return true;
  }

  private findLabel(element: HTMLElement): string {
    const id = element.id;
    if (id) {
      const labelElement = document.querySelector(`label[for="${id}"]`);
      if (labelElement) {
        return labelElement.textContent?.trim() || '';
      }
    }

    // Check for parent label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      return parentLabel.textContent?.trim() || '';
    }

    return '';
  }

  private recordStep(step: WorkflowStep): void {
    this.recordedSteps.push(step);
    console.log('Recorded step:', step);
  }
}
