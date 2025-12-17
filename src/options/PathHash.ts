import * as crypto from 'crypto';
import { BaseOption, OptionContext } from './BaseOption';

/**
 * Option 2: Path Hash
 * MD5 hash of the file's relative path from workspace root
 */
export class PathHash extends BaseOption {
    readonly id = 'pathHash';
    readonly name = 'Path Hash';
    readonly description = 'Hash of the relative file path';

    private readonly DEFAULT_LENGTH = 8;

    generate(context: OptionContext): string {
        const length = this.getConfig<number>('pathHashLength', this.DEFAULT_LENGTH);
        
        if (!context.relativePath) {
            return '';
        }

        // Generate MD5 hash of the relative path
        const hash = crypto
            .createHash('md5')
            .update(context.relativePath)
            .digest('hex');

        // Truncate to configured length
        return hash.substring(0, length);
    }
}

