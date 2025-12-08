/**
 * Types related to character consent
 * Based on the character_consent table in the database
 */

/**
 * Represents a character consent from the database
 */
export interface CharacterConsent {
  name: string;
  consenter_name: string;
  corpse_id: number;
}

/**
 * Represents a simplified view of a character consent
 */
export interface SimpleConsent {
  characterName: string;
  consenterName: string;
  corpseId: number;
}

/**
 * Converts a CharacterConsent object to a SimpleConsent object
 */
export function toSimpleConsent(consent: CharacterConsent): SimpleConsent {
  return {
    characterName: consent.name,
    consenterName: consent.consenter_name,
    corpseId: consent.corpse_id,
  };
}
