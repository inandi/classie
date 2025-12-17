import { BaseOption, OptionContext } from './BaseOption';
import { getDomAncestors } from '../utils/domParser';

/**
 * Option 5: Abbreviated DOM Position
 * Human-readable DOM path using first N characters of each ancestor tag
 */
export class AbbreviatedDomPosition extends BaseOption {
    readonly id = 'abbreviatedDomPosition';
    readonly name = 'Abbreviated DOM Position';
    readonly description = 'Abbreviated ancestor tag names (e.g., div-sec-hea-spa)';

    private readonly DEFAULT_ABBR_LENGTH = 3;
    
    // Tags to exclude from the path
    private readonly EXCLUDED_TAGS = ['html', 'head', 'body', 'script', 'style'];

    generate(context: OptionContext): string {
        const abbrLength = this.getConfig<number>('abbrLength', this.DEFAULT_ABBR_LENGTH);
        
        // Get the DOM ancestors
        const ancestors = getDomAncestors(context.documentText, context.elementOffset);
        
        if (!ancestors || ancestors.length === 0) {
            return '';
        }

        // Filter out excluded tags and abbreviate each
        const abbreviated = ancestors
            .filter(tag => !this.EXCLUDED_TAGS.includes(tag.toLowerCase()))
            .map(tag => tag.substring(0, abbrLength).toLowerCase());

        return abbreviated.join('-');
    }
}

