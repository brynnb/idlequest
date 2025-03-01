/**
 * Types related to rule sets
 * Based on the rule_sets table in the database
 */

/**
 * Represents a rule set from the database
 */
export interface RuleSets {
  ruleset_id: number;
  name: string;
}

/**
 * Represents a simplified view of a rule set
 */
export interface SimpleRuleSet {
  id: number;
  name: string;
}

/**
 * Converts a RuleSets object to a SimpleRuleSet object
 */
export function toSimpleRuleSet(ruleSet: RuleSets): SimpleRuleSet {
  return {
    id: ruleSet.ruleset_id,
    name: ruleSet.name,
  };
}
