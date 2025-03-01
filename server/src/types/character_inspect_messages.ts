/**
 * Types related to character inspect messages
 * Based on the character_inspect_messages table in the database
 */

/**
 * Represents a character inspect message from the database
 */
export interface CharacterInspectMessages {
  id: number;
  inspect_message: string;
}

/**
 * Represents a simplified view of a character inspect message
 */
export interface SimpleInspectMessage {
  characterId: number;
  message: string;
}

/**
 * Converts a CharacterInspectMessages object to a SimpleInspectMessage object
 */
export function toSimpleInspectMessage(
  inspectMessage: CharacterInspectMessages
): SimpleInspectMessage {
  return {
    characterId: inspectMessage.id,
    message: inspectMessage.inspect_message,
  };
}
