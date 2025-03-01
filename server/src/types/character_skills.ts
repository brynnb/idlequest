/**
 * Types related to character skills
 * Based on the character_skills table in the database
 */

/**
 * Represents a character skill from the database
 */
export interface CharacterSkills {
  id: number;
  skill_id: number;
  value: number;
}

/**
 * Represents a simplified view of a character skill
 */
export interface SimpleSkill {
  skillId: number;
  value: number;
}

/**
 * Converts a CharacterSkills object to a SimpleSkill object
 */
export function toSimpleSkill(skill: CharacterSkills): SimpleSkill {
  return {
    skillId: skill.skill_id,
    value: skill.value,
  };
}
