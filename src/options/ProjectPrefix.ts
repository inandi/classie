import { BaseOption, OptionContext } from './BaseOption';

/**
 * Option 1: Project Prefix (Pre-text)
 * A custom text that applies to the entire project (max 50 chars)
 */
export class ProjectPrefix extends BaseOption {
    readonly id = 'projectPrefix';
    readonly name = 'Project Prefix';
    readonly description = 'Custom text prefix for the entire project (max 50 chars)';

    private readonly MAX_LENGTH = 50;

    generate(context: OptionContext): string {
        const prefix = this.getConfig<string>('projectPrefix', '');
        
        if (!prefix) {
            return '';
        }

        // Truncate to max length and sanitize
        return this.sanitize(prefix.substring(0, this.MAX_LENGTH));
    }

    /**
     * Sanitize the prefix to be CSS class compatible
     * - Convert to lowercase
     * - Replace spaces with hyphens
     * - Remove invalid characters
     */
    private sanitize(value: string): string {
        return value
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-_]/g, '');
    }
}

