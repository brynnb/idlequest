/**
 * Types related to rule values
 * Based on the rule_values table in the database
 */

/**
 * Represents a rule value from the database
 */
export interface RuleValues {
  ruleset_id: number;
  rule_name: string;
  rule_value: string;
  notes: string;
}

/**
 * Represents a simplified view of a rule value
 */
export interface SimpleRuleValue {
  rulesetId: number;
  ruleName: string;
  value: string;
  notes: string;
}

/**
 * Converts a RuleValues object to a SimpleRuleValue object
 */
export function toSimpleRuleValue(ruleValue: RuleValues): SimpleRuleValue {
  return {
    rulesetId: ruleValue.ruleset_id,
    ruleName: ruleValue.rule_name,
    value: ruleValue.rule_value,
    notes: ruleValue.notes,
  };
}
