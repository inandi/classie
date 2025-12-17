/**
 * CSS GPS Rules
 * Export all rule classes
 */

export { BaseRule } from './BaseRule';
export { RuleAlpha } from './RuleAlpha';
export { RuleBeta } from './RuleBeta';
export { RuleGamma } from './RuleGamma';

import { BaseRule } from './BaseRule';
import { RuleAlpha } from './RuleAlpha';
import { RuleBeta } from './RuleBeta';
import { RuleGamma } from './RuleGamma';

/**
 * All preset rules
 */
export const PresetRules = {
    alpha: new RuleAlpha(),
    beta: new RuleBeta(),
    gamma: new RuleGamma(),
};

/**
 * Get all preset rules as an array
 */
export function getAllPresetRules(): BaseRule[] {
    return Object.values(PresetRules);
}

/**
 * Get a preset rule by ID
 */
export function getRuleById(id: string): BaseRule | undefined {
    return getAllPresetRules().find(rule => rule.id === id);
}

