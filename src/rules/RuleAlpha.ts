import { BaseRule } from './BaseRule';
import { BaseOption, ProjectPrefix, AbbreviatedFilePath, PathHash } from '../options';

/**
 * Rule Alpha: Project Prefix + Abbreviated File Path + Path Hash
 * 
 * Example output: project-sample--int-tem-cli-uti--a3f2b9c1
 * 
 * Components:
 * - projectPrefix: User-defined project identifier
 * - abbreviatedFilePath: Human-readable path (int-tem-cli-uti)
 * - pathHash: Hash for uniqueness (a3f2b9c1)
 */
export class RuleAlpha extends BaseRule {
    readonly id = 'ruleAlpha';
    readonly name = 'Rule Alpha';
    readonly description = 'Project Prefix + Abbreviated File Path + Path Hash';

    readonly options: BaseOption[] = [
        new ProjectPrefix(),
        new AbbreviatedFilePath(),
        new PathHash(),
    ];

    protected separator = '--';
}
