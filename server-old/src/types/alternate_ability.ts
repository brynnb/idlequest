/**
 * Alternate Ability Types
 * Based on the character_alternate_abilities table in the database
 */

/**
 * Represents a character's alternate ability
 */
export interface CharacterAlternateAbility {
  id: number;
  slot: number;
  aa_id: number;
  aa_value: number;
}

/**
 * Represents an alternate ability definition
 */
export interface AlternateAbility {
  id: number;
  name: string;
  description: string;
  category: AlternateAbilityCategory;
  cost: number;
  max_level: number;
  type: AlternateAbilityType;
  prereq_skill: number;
  prereq_minpoints: number;
  spell_id: number;
  spell_type: number;
  spell_refresh: number;
  classes: number;
  berserker: number;
  class_type: number;
  cost_inc: number;
  aa_expansion: number;
  special_category: number;
  sof_type: number;
  sof_cost_inc: number;
  sof_max_level: number;
  sof_next_skill: number;
  clientver: number;
  account_time_required: number;
  total_abilities: number;
}

/**
 * Enum for alternate ability categories
 */
export enum AlternateAbilityCategory {
  GENERAL = 1,
  ARCHETYPE = 2,
  CLASS = 3,
  SPECIAL = 4,
  FOCUS_EFFECTS = 5,
  MERC = 6,
  TRADESKILL = 7,
}

/**
 * Enum for alternate ability types
 */
export enum AlternateAbilityType {
  PASSIVE = 1,
  ACTIVE = 2,
}

/**
 * Represents a character's alternate ability with its definition
 */
export interface CharacterAlternateAbilityWithDefinition {
  character_aa: CharacterAlternateAbility;
  definition: AlternateAbility;
}
