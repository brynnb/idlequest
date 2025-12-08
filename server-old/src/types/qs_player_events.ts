/**
 * Types related to quest statistics player events
 * Based on the qs_player_events table in the database
 */

/**
 * Represents a quest statistics player event from the database
 */
export interface QSPlayerEvents {
  id: number;
  char_id: number | null;
  event: number | null;
  event_desc: string | null;
  time: number | null;
}

/**
 * Represents a simplified view of a quest statistics player event
 */
export interface SimplePlayerEvent {
  id: number;
  characterId: number | null;
  eventId: number | null;
  eventDescription: string | null;
  timestamp: number | null;
}

/**
 * Converts a QSPlayerEvents object to a SimplePlayerEvent object
 */
export function toSimplePlayerEvent(event: QSPlayerEvents): SimplePlayerEvent {
  return {
    id: event.id,
    characterId: event.char_id,
    eventId: event.event,
    eventDescription: event.event_desc,
    timestamp: event.time,
  };
}
