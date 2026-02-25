import { BaseRule } from './BaseRule';
import { BaseOption, ProjectPrefix, ReversedFileName } from '../options';

/**
 * Rule Gamma: Project Prefix + Reversed File Name
 * 
 * Example output: project-sample--llib_ytilitu
 * 
 * Components:
 * - projectPrefix: User-defined project identifier
 * - reversedFileName: File name reversed (llib_ytilitu)
 */
export class RuleGamma extends BaseRule {
    readonly id = 'ruleGamma';
    readonly name = 'Rule Gamma';
    readonly description = 'Project Prefix + Reversed File Name';

    readonly options: BaseOption[] = [
        new ProjectPrefix(),
        new ReversedFileName(),
    ];

    protected separator = '--';
}

