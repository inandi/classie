/**
 * Classie Rule Beta Module
 *
 * Preset rule: Project Prefix + Abbreviated DOM Position + DOM Hash.
 * Example: project-sample--div-sec-hea-spa--e7c3a1b9
 *
 * @author Gobinda Nandi <gobinda.nandi.public@gmail.com>
 * @since 1.1.1 [10-12-2025]
 * @version 1.1.1
 * @copyright (c) 2025 Gobinda Nandi
 */

import { BaseRule } from './BaseRule';
import { BaseOption, ProjectPrefix, AbbreviatedDomPosition, DomHash } from '../options';

/**
 * Rule Beta: Project Prefix + Abbreviated DOM Position + DOM Hash
 * 
 * Example output: project-sample--div-sec-hea-spa--e7c3a1b9
 * 
 * Components:
 * - projectPrefix: User-defined project identifier
 * - abbreviatedDomPosition: Human-readable DOM path (div-sec-hea-spa)
 * - domHash: Hash for uniqueness (e7c3a1b9)
 */
export class RuleBeta extends BaseRule {
    readonly id = 'ruleBeta';
    readonly name = 'Rule Beta';
    readonly description = 'Project Prefix + Abbreviated DOM Position + DOM Hash';

    readonly options: BaseOption[] = [
        new ProjectPrefix(),
        new AbbreviatedDomPosition(),
        new DomHash(),
    ];

    protected separator = '--';
}
