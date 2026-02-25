import * as crypto from 'crypto';
import { BaseOption, OptionContext } from './BaseOption';
import { getDomAncestorChain } from '../utils/domParser';

/**
 * Option 4: DOM Hash
 * MD5 hash of the element's position in the DOM hierarchy
 */
export class DomHash extends BaseOption {
    readonly id = 'domHash';
    readonly name = 'DOM Hash';
    readonly description = 'Hash of the DOM ancestor chain';

    private readonly DEFAULT_LENGTH = 8;

    generate(context: OptionContext): string {
        const length = this.getConfig<number>('domHashLength', this.DEFAULT_LENGTH);
        
        // Get the DOM ancestor chain
        const ancestorChain = getDomAncestorChain(context.documentText, context.elementOffset);
        
        if (!ancestorChain) {
            return '';
        }

        // Generate MD5 hash of the DOM path
        const hash = crypto
            .createHash('md5')
            .update(ancestorChain)
            .digest('hex');

        // Truncate to configured length
        return hash.substring(0, length);
    }
}

