/**
 * Types related to event logging
 * Based on the eventlog table in the database
 */

/**
 * Represents an event log entry from the database
 */
export interface EventLog {
  id: number;
  accountname: string;
  accountid: number | null;
  status: number;
  charname: string;
  target: string;
  time: string;
  descriptiontype: string;
  description: string;
  event_nid: number;
}

/**
 * Represents a simplified view of an event log entry
 */
export interface SimpleEventLog {
  id: number;
  accountName: string;
  accountId: number | null;
  status: number;
  characterName: string;
  target: string;
  timestamp: string;
  eventType: string;
  description: string;
  eventNodeId: number;
}

/**
 * Converts an EventLog object to a SimpleEventLog object
 */
export function toSimpleEventLog(event: EventLog): SimpleEventLog {
  return {
    id: event.id,
    accountName: event.accountname,
    accountId: event.accountid,
    status: event.status,
    characterName: event.charname,
    target: event.target,
    timestamp: event.time,
    eventType: event.descriptiontype,
    description: event.description,
    eventNodeId: event.event_nid,
  };
}
