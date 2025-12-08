/**
 * Types related to character languages
 * Based on the character_languages table in the database
 */

/**
 * Represents a character language from the database
 */
export interface CharacterLanguages {
  id: number;
  char_id: number;
  lang_id: number;
  value: number;
}

/**
 * Represents a simplified view of a character language
 */
export interface SimpleLanguage {
  characterId: number;
  languageId: number;
  value: number;
}

/**
 * Converts a CharacterLanguages object to a SimpleLanguage object
 */
export function toSimpleLanguage(language: CharacterLanguages): SimpleLanguage {
  return {
    characterId: language.char_id,
    languageId: language.lang_id,
    value: language.value,
  };
}
