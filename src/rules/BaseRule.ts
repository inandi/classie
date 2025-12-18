import { BaseOption, OptionContext } from '../options';

/**
 * Base class for all Classie rules
 * A rule is a combination of options with a specific separator pattern
 */
export abstract class BaseRule {
    /** Unique identifier for this rule */
    abstract readonly id: string;
    
    /** Display name for this rule */
    abstract readonly name: string;
    
    /** Description of what this rule generates */
    abstract readonly description: string;

    /** Options used in this rule (in order) */
    abstract readonly options: BaseOption[];

    /** Separator between option outputs */
    protected separator: string = '--';

    /**
     * Generate the CSS class name using all options
     * @param context The context containing file and element information
     * @returns The generated class name
     */
    generate(context: OptionContext): string {
        const parts: string[] = [];

        for (const option of this.options) {
            const value = option.generate(context);
            if (value) {
                parts.push(value);
            }
        }

        return parts.join(this.separator);
    }

    /**
     * Get a preview of what this rule will generate
     */
    getPattern(): string {
        return this.options.map(opt => `{${opt.id}}`).join(this.separator);
    }
}

