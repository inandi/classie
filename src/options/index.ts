/**
 * Classie Options Index Module
 *
 * Exports all option classes, AllOptions array, getOptionById(), and OptionIds.
 *
 * @author Gobinda Nandi <gobinda.nandi.public@gmail.com>
 * @since 1.1.1 [10-12-2025]
 * @version 1.1.1
 * @copyright (c) 2025 Gobinda Nandi
 */

export { BaseOption, OptionContext } from './BaseOption';
export { ProjectPrefix } from './ProjectPrefix';
export { PathHash } from './PathHash';
export { ReversedFileName } from './ReversedFileName';
export { DomHash } from './DomHash';
export { AbbreviatedDomPosition } from './AbbreviatedDomPosition';
export { AbbreviatedFilePath } from './AbbreviatedFilePath';
export { ReleaseName } from './ReleaseName';

import { BaseOption } from './BaseOption';
import { ProjectPrefix } from './ProjectPrefix';
import { PathHash } from './PathHash';
import { ReversedFileName } from './ReversedFileName';
import { DomHash } from './DomHash';
import { AbbreviatedDomPosition } from './AbbreviatedDomPosition';
import { AbbreviatedFilePath } from './AbbreviatedFilePath';
import { ReleaseName } from './ReleaseName';

/**
 * All available options
 */
export const AllOptions: BaseOption[] = [
    new ProjectPrefix(),           // Option 1
    new PathHash(),                // Option 2
    new ReversedFileName(),        // Option 3
    new DomHash(),                 // Option 4
    new AbbreviatedDomPosition(),  // Option 5
    new AbbreviatedFilePath(),     // Option 6
    new ReleaseName(),             // Option 7
];

/**
 * Get an option by its ID
 */
export function getOptionById(id: string): BaseOption | undefined {
    return AllOptions.find(opt => opt.id === id);
}

/**
 * Option IDs for easy reference
 */
export const OptionIds = {
    PROJECT_PREFIX: 'projectPrefix',
    PATH_HASH: 'pathHash',
    REVERSED_FILE_NAME: 'reversedFileName',
    DOM_HASH: 'domHash',
    ABBREVIATED_DOM: 'abbreviatedDomPosition',
    ABBREVIATED_PATH: 'abbreviatedFilePath',
    RELEASE_NAME: 'releaseName',
} as const;
