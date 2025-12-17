import { BaseOption, OptionContext } from './BaseOption';

/**
 * Option 3: Reversed File Name
 * File name (without extension) reversed
 */
export class ReversedFileName extends BaseOption {
    readonly id = 'reversedFileName';
    readonly name = 'Reversed File Name';
    readonly description = 'File name reversed (without extension)';

    generate(context: OptionContext): string {
        if (!context.fileName) {
            return '';
        }

        const caseOption = this.getConfig<string>('reversedNameCase', 'lowercase');
        
        // Reverse the filename
        const reversed = context.fileName.split('').reverse().join('');

        // Apply case transformation
        switch (caseOption) {
            case 'uppercase':
                return reversed.toUpperCase();
            case 'lowercase':
                return reversed.toLowerCase();
            default:
                return reversed;
        }
    }
}

