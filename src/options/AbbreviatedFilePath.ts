/**
 * Classie Option 6: Abbreviated File Path Module
 *
 * Human-readable path from first N chars of each folder/file name.
 * Skips common roots (www, htdocs, public_html, src, app). Uses classie.abbrLength.
 *
 * @author Gobinda Nandi <gobinda.nandi.public@gmail.com>
 * @since 1.1.1 [10-12-2025]
 * @version 1.1.1
 * @copyright (c) 2025 Gobinda Nandi
 */

import { BaseOption, OptionContext } from './BaseOption';

/**
 * Option 6: Abbreviated File Path
 * Human-readable file path using first N characters of each folder/file name
 */
export class AbbreviatedFilePath extends BaseOption {
    readonly id = 'abbreviatedFilePath';
    readonly name = 'Abbreviated File Path';
    readonly description = 'Abbreviated folder/file names (e.g., int-tem-cli-uti)';

    private readonly DEFAULT_ABBR_LENGTH = 3;
    
    // Common root folders to skip
    private readonly SKIP_FOLDERS = ['www', 'htdocs', 'public_html', 'src', 'app'];

    generate(context: OptionContext): string {
        const abbrLength = this.getConfig<number>('abbrLength', this.DEFAULT_ABBR_LENGTH);
        
        if (!context.relativePath) {
            return '';
        }

        // Normalize path separators and split
        const segments = context.relativePath
            .replace(/\\/g, '/')
            .split('/')
            .filter(segment => segment.length > 0);

        if (segments.length === 0) {
            return '';
        }

        // Find where meaningful path starts
        let startIndex = 0;
        for (let i = 0; i < segments.length; i++) {
            if (this.SKIP_FOLDERS.includes(segments[i].toLowerCase())) {
                startIndex = i + 1;
                break;
            }
        }

        // Get meaningful segments
        const meaningfulSegments = segments.slice(startIndex);
        
        if (meaningfulSegments.length === 0) {
            // If all skipped, use all segments
            return this.abbreviateSegments(segments, abbrLength);
        }

        return this.abbreviateSegments(meaningfulSegments, abbrLength);
    }

    /**
     * Abbreviate an array of path segments
     */
    private abbreviateSegments(segments: string[], length: number): string {
        return segments
            .map(segment => {
                // Remove file extension from last segment
                const clean = segment.replace(/\.[^/.]+$/, '');
                return clean.substring(0, length).toLowerCase();
            })
            .join('-');
    }
}

