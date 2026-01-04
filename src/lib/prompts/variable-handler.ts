/**
 * Dynamic variable handling system for template substitution
 *
 * Provides flexible variable interpolation for prompt templates
 * with support for default values, formatting, and validation.
 */

import type { DynamicVariable, PromptConfig, ContactInfo } from './types';

/**
 * Variable pattern for matching template variables
 * Supports: {{variableName}}, {{variableName | default: "value"}}, {{variableName | format: "option"}}
 */
const VARIABLE_PATTERN = /\{\{([^}|]+)(?:\s*\|\s*([^}]+))?\}\}/g;

/**
 * Default system variables that are always available
 */
export function getSystemVariables(config: PromptConfig): DynamicVariable[] {
  const systemVars: DynamicVariable[] = [
    {
      name: 'businessName',
      value: config.businessName,
      description: 'Name des Unternehmens',
    },
    {
      name: 'businessHours',
      value: config.businessHours,
      description: 'Oeffnungszeiten',
    },
    {
      name: 'servicesCount',
      value: String(config.services.length),
      description: 'Anzahl der Dienstleistungen',
    },
    {
      name: 'servicesList',
      value: config.services.join(', ') || 'keine angegeben',
      description: 'Liste aller Dienstleistungen',
    },
    {
      name: 'faqCount',
      value: String(config.faqs.length),
      description: 'Anzahl der FAQs',
    },
    {
      name: 'hasPolicies',
      value: config.policies ? 'ja' : 'nein',
      description: 'Ob Richtlinien vorhanden sind',
    },
    {
      name: 'hasCalendar',
      value: config.hasGoogleCalendar ? 'ja' : 'nein',
      description: 'Ob Kalenderintegration aktiv ist',
    },
  ];

  // Add business description if available
  if (config.businessDescription) {
    systemVars.push({
      name: 'businessDescription',
      value: config.businessDescription,
      description: 'Beschreibung des Unternehmens',
    });
  }

  // Add contact info variables if available
  if (config.contactInfo) {
    const contact = config.contactInfo;
    if (contact.phone) {
      systemVars.push({
        name: 'phone',
        value: contact.phone,
        description: 'Telefonnummer',
      });
    }
    if (contact.email) {
      systemVars.push({
        name: 'email',
        value: contact.email,
        description: 'E-Mail-Adresse',
      });
    }
    if (contact.address) {
      systemVars.push({
        name: 'address',
        value: contact.address,
        description: 'Adresse',
      });
    }
    if (contact.website) {
      systemVars.push({
        name: 'website',
        value: contact.website,
        description: 'Website',
      });
    }
  }

  // Add tone and style variables
  if (config.tone) {
    systemVars.push({
      name: 'tone',
      value: config.tone,
      description: 'Gewaehlter Tonfall',
    });
  }

  if (config.responseLength) {
    systemVars.push({
      name: 'responseLength',
      value: config.responseLength,
      description: 'Gewuenschte Antwortlaenge',
    });
  }

  return systemVars;
}

/**
 * Merge system variables with custom variables
 * Custom variables take precedence over system variables
 */
export function mergeVariables(
  systemVars: DynamicVariable[],
  customVars?: DynamicVariable[]
): Map<string, DynamicVariable> {
  const variableMap = new Map<string, DynamicVariable>();

  // Add system variables first
  for (const variable of systemVars) {
    variableMap.set(variable.name.toLowerCase(), variable);
  }

  // Override with custom variables
  if (customVars) {
    for (const variable of customVars) {
      variableMap.set(variable.name.toLowerCase(), variable);
    }
  }

  return variableMap;
}

/**
 * Parse variable modifiers from template syntax
 * Supports: default, format, uppercase, lowercase
 */
function parseModifiers(
  modifierString: string
): { type: string; value: string }[] {
  const modifiers: { type: string; value: string }[] = [];

  const parts = modifierString.split('|').map((p) => p.trim());
  for (const part of parts) {
    const colonIndex = part.indexOf(':');
    if (colonIndex > -1) {
      const type = part.substring(0, colonIndex).trim();
      const value = part
        .substring(colonIndex + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
      modifiers.push({ type, value });
    } else {
      modifiers.push({ type: part, value: '' });
    }
  }

  return modifiers;
}

/**
 * Apply modifiers to a variable value
 */
function applyModifiers(
  value: string,
  modifiers: { type: string; value: string }[]
): string {
  let result = value;

  for (const modifier of modifiers) {
    switch (modifier.type) {
      case 'default':
        if (!result || result.trim() === '') {
          result = modifier.value;
        }
        break;
      case 'uppercase':
        result = result.toUpperCase();
        break;
      case 'lowercase':
        result = result.toLowerCase();
        break;
      case 'capitalize':
        result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
        break;
      case 'truncate':
        const maxLength = parseInt(modifier.value, 10) || 50;
        if (result.length > maxLength) {
          result = result.substring(0, maxLength) + '...';
        }
        break;
      case 'list':
        // Format as bullet list
        const separator = modifier.value || ', ';
        result = result
          .split(separator)
          .map((item) => `- ${item.trim()}`)
          .join('\n');
        break;
    }
  }

  return result;
}

/**
 * Interpolate variables in a template string
 *
 * @param template - Template string with variable placeholders
 * @param variables - Map of variable name to variable definition
 * @returns Interpolated string
 */
export function interpolateVariables(
  template: string,
  variables: Map<string, DynamicVariable>
): string {
  return template.replace(
    VARIABLE_PATTERN,
    (match, variableName: string, modifierString?: string) => {
      const normalizedName = variableName.trim().toLowerCase();
      const variable = variables.get(normalizedName);

      if (!variable) {
        // If variable not found and no default specified, keep the placeholder
        if (modifierString) {
          const modifiers = parseModifiers(modifierString);
          const defaultModifier = modifiers.find((m) => m.type === 'default');
          if (defaultModifier) {
            return defaultModifier.value;
          }
        }
        return match;
      }

      let value = variable.value;

      // Apply modifiers if present
      if (modifierString) {
        const modifiers = parseModifiers(modifierString);
        value = applyModifiers(value, modifiers);
      }

      return value;
    }
  );
}

/**
 * Validate that all required variables are present
 *
 * @param template - Template string to check
 * @param variables - Available variables
 * @returns Array of missing variable names
 */
export function validateVariables(
  template: string,
  variables: Map<string, DynamicVariable>
): string[] {
  const missingVariables: string[] = [];
  let match;

  const pattern = new RegExp(VARIABLE_PATTERN.source, 'g');
  while ((match = pattern.exec(template)) !== null) {
    const variableName = match[1].trim().toLowerCase();
    const modifierString = match[2];

    if (!variables.has(variableName)) {
      // Check if there's a default modifier
      const hasDefault =
        modifierString && modifierString.includes('default:');
      if (!hasDefault) {
        missingVariables.push(variableName);
      }
    }
  }

  return Array.from(new Set(missingVariables));
}

/**
 * Extract all variable names from a template
 *
 * @param template - Template string to analyze
 * @returns Array of variable names found
 */
export function extractVariableNames(template: string): string[] {
  const variableNames: string[] = [];
  let match;

  const pattern = new RegExp(VARIABLE_PATTERN.source, 'g');
  while ((match = pattern.exec(template)) !== null) {
    variableNames.push(match[1].trim());
  }

  return Array.from(new Set(variableNames));
}

/**
 * Create a variable context for prompt generation
 *
 * @param config - Prompt configuration
 * @returns Complete variable map ready for interpolation
 */
export function createVariableContext(
  config: PromptConfig
): Map<string, DynamicVariable> {
  const systemVars = getSystemVariables(config);
  return mergeVariables(systemVars, config.customVariables);
}
