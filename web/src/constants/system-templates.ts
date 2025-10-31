/**
 * Prompt optimization System role template constants
 * Fixed System template shared by all categories
 * This file provides dynamic access to localized system templates.
 */

import { OPTIMIZATION_SYSTEM_TEMPLATE_EN } from '../../../locales/en/system-templates';
import { OPTIMIZATION_SYSTEM_TEMPLATE_ZH } from '../../../locales/zh/system-templates';

/**
 * Supported languages
 */
export type Language = 'en' | 'zh';

/**
 * Template registry for all languages
 */
const templates: Record<Language, string> = {
  en: OPTIMIZATION_SYSTEM_TEMPLATE_EN,
  zh: OPTIMIZATION_SYSTEM_TEMPLATE_ZH,
};

/**
 * Deprecated: This constant is now language-dependent.
 * Use getOptimizationSystemTemplate(lang) instead.
 * Kept for backward compatibility, defaults to Chinese.
 */
export const OPTIMIZATION_SYSTEM_TEMPLATE = templates.zh;

/**
 * System template version information
 */
export const SYSTEM_TEMPLATE_VERSION = '2.0.0';
export const SYSTEM_TEMPLATE_LAST_UPDATED = '2025-01-04';

/**
 * Get optimization System template
 * @param lang The desired language ('en', 'zh', etc.). Defaults to 'zh'.
 * @returns The system template in the specified language
 */
export function getOptimizationSystemTemplate(lang: Language = 'zh'): string {
  return templates[lang] || templates.zh;
}

/**
 * Validate if System template is valid
 * @param template The template string to validate
 * @returns true if the template contains required sections
 */
export function validateSystemTemplate(template: string): boolean {
  const templateToCheck = template;
  return templateToCheck.includes('# Role: System') && 
         templateToCheck.includes('## Profile') &&
         templateToCheck.includes('## Output Requirements');
}
