/**
 * ARIA Utilities
 *
 * Provides utilities for managing ARIA attributes.
 * Implements WCAG 2.1 Success Criteria:
 * - 1.3.1 Info and Relationships
 * - 4.1.2 Name, Role, Value
 */

/**
 * Generate a unique ID for ARIA relationships
 */
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create aria-describedby relationship
 */
export function createAriaDescribedBy(
  input: HTMLElement,
  description: HTMLElement
): string {
  const id = description.id || generateAriaId('desc');
  description.id = id;
  input.setAttribute('aria-describedby', id);
  return id;
}

/**
 * Create aria-labelledby relationship
 */
export function createAriaLabelledBy(
  element: HTMLElement,
  label: HTMLElement
): string {
  const id = label.id || generateAriaId('label');
  label.id = id;
  element.setAttribute('aria-labelledby', id);
  return id;
}

/**
 * Create aria-controls relationship
 */
export function createAriaControls(
  trigger: HTMLElement,
  controlled: HTMLElement
): string {
  const id = controlled.id || generateAriaId('panel');
  controlled.id = id;
  trigger.setAttribute('aria-controls', id);
  return id;
}

/**
 * Set aria-expanded state
 */
export function setAriaExpanded(element: HTMLElement, expanded: boolean): void {
  element.setAttribute('aria-expanded', String(expanded));
}

/**
 * Set aria-selected state
 */
export function setAriaSelected(element: HTMLElement, selected: boolean): void {
  element.setAttribute('aria-selected', String(selected));
}

/**
 * Set aria-checked state
 */
export function setAriaChecked(
  element: HTMLElement,
  checked: boolean | 'mixed'
): void {
  element.setAttribute('aria-checked', String(checked));
}

/**
 * Set aria-current for navigation
 */
export function setAriaCurrent(
  element: HTMLElement,
  current: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false'
): void {
  if (current === 'false') {
    element.removeAttribute('aria-current');
  } else {
    element.setAttribute('aria-current', current);
  }
}

/**
 * Set aria-pressed state for toggle buttons
 */
export function setAriaPressed(
  element: HTMLElement,
  pressed: boolean | 'mixed'
): void {
  element.setAttribute('aria-pressed', String(pressed));
}

/**
 * Set aria-disabled state
 */
export function setAriaDisabled(element: HTMLElement, disabled: boolean): void {
  element.setAttribute('aria-disabled', String(disabled));
}

/**
 * Set aria-hidden to hide from assistive technology
 */
export function setAriaHidden(element: HTMLElement, hidden: boolean): void {
  element.setAttribute('aria-hidden', String(hidden));
}

/**
 * Set aria-invalid for form validation
 */
export function setAriaInvalid(
  element: HTMLElement,
  invalid: boolean | 'grammar' | 'spelling'
): void {
  if (invalid === false) {
    element.removeAttribute('aria-invalid');
  } else {
    element.setAttribute('aria-invalid', String(invalid));
  }
}

/**
 * Set aria-required for required form fields
 */
export function setAriaRequired(element: HTMLElement, required: boolean): void {
  element.setAttribute('aria-required', String(required));
}

/**
 * Set aria-busy for loading states
 */
export function setAriaBusy(element: HTMLElement, busy: boolean): void {
  element.setAttribute('aria-busy', String(busy));
}

/**
 * Create an accessible error message for form fields
 */
export function createAccessibleErrorMessage(
  input: HTMLElement,
  errorContainer: HTMLElement,
  errorMessage: string
): void {
  const errorId = errorContainer.id || generateAriaId('error');
  errorContainer.id = errorId;
  errorContainer.setAttribute('role', 'alert');
  errorContainer.setAttribute('aria-live', 'polite');
  errorContainer.textContent = errorMessage;

  // Link error to input
  const existingDescribedBy = input.getAttribute('aria-describedby');
  if (existingDescribedBy) {
    input.setAttribute('aria-describedby', `${existingDescribedBy} ${errorId}`);
  } else {
    input.setAttribute('aria-describedby', errorId);
  }

  setAriaInvalid(input, true);
}

/**
 * Clear accessible error message from form field
 */
export function clearAccessibleErrorMessage(
  input: HTMLElement,
  errorContainer: HTMLElement
): void {
  const errorId = errorContainer.id;
  if (errorId) {
    const describedBy = input.getAttribute('aria-describedby');
    if (describedBy) {
      const ids = describedBy.split(' ').filter(id => id !== errorId);
      if (ids.length > 0) {
        input.setAttribute('aria-describedby', ids.join(' '));
      } else {
        input.removeAttribute('aria-describedby');
      }
    }
  }

  errorContainer.textContent = '';
  setAriaInvalid(input, false);
}

/**
 * ARIA roles for common patterns
 */
export const AriaRoles = {
  // Landmarks
  BANNER: 'banner',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  SEARCH: 'search',
  REGION: 'region',

  // Widget roles
  BUTTON: 'button',
  CHECKBOX: 'checkbox',
  DIALOG: 'dialog',
  GRID: 'grid',
  LISTBOX: 'listbox',
  MENU: 'menu',
  MENUBAR: 'menubar',
  MENUITEM: 'menuitem',
  OPTION: 'option',
  PROGRESSBAR: 'progressbar',
  RADIO: 'radio',
  RADIOGROUP: 'radiogroup',
  SCROLLBAR: 'scrollbar',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  STATUS: 'status',
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  TEXTBOX: 'textbox',
  TIMER: 'timer',
  TOOLTIP: 'tooltip',
  TREEITEM: 'treeitem',

  // Live region roles
  ALERT: 'alert',
  LOG: 'log',
  MARQUEE: 'marquee',
  ALERTDIALOG: 'alertdialog',

  // Document structure
  ARTICLE: 'article',
  CELL: 'cell',
  COLUMNHEADER: 'columnheader',
  DEFINITION: 'definition',
  DIRECTORY: 'directory',
  DOCUMENT: 'document',
  FEED: 'feed',
  FIGURE: 'figure',
  GROUP: 'group',
  HEADING: 'heading',
  IMG: 'img',
  LIST: 'list',
  LISTITEM: 'listitem',
  MATH: 'math',
  NONE: 'none',
  NOTE: 'note',
  PRESENTATION: 'presentation',
  ROW: 'row',
  ROWGROUP: 'rowgroup',
  ROWHEADER: 'rowheader',
  SEPARATOR: 'separator',
  TABLE: 'table',
  TERM: 'term',
  TOOLBAR: 'toolbar',
  TREE: 'tree',
  TREEGRID: 'treegrid',
} as const;
