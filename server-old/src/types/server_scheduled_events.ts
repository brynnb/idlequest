/**
 * Types related to server scheduled events
 * Based on the server_scheduled_events table in the database
 */

/**
 * Represents a server scheduled event from the database
 */
export interface ServerScheduledEvents {
  id: number;
  description: string | null;
  event_type: string | null;
  event_data: string | null;
  minute_start: number | null;
  hour_start: number | null;
  day_start: number | null;
  month_start: number | null;
  year_start: number | null;
  minute_end: number | null;
  hour_end: number | null;
  day_end: number | null;
  month_end: number | null;
  year_end: number | null;
  cron_expression: string | null;
  created_at: string | null;
  deleted_at: string | null;
}

/**
 * Represents a simplified view of a server scheduled event
 */
export interface SimpleScheduledEvent {
  id: number;
  description: string | null;
  eventType: string | null;
  eventData: string | null;
  startTime: {
    minute: number | null;
    hour: number | null;
    day: number | null;
    month: number | null;
    year: number | null;
  };
  endTime: {
    minute: number | null;
    hour: number | null;
    day: number | null;
    month: number | null;
    year: number | null;
  };
  cronExpression: string | null;
  createdAt: string | null;
  deletedAt: string | null;
}

/**
 * Converts a ServerScheduledEvents object to a SimpleScheduledEvent object
 */
export function toSimpleScheduledEvent(
  event: ServerScheduledEvents
): SimpleScheduledEvent {
  return {
    id: event.id,
    description: event.description,
    eventType: event.event_type,
    eventData: event.event_data,
    startTime: {
      minute: event.minute_start,
      hour: event.hour_start,
      day: event.day_start,
      month: event.month_start,
      year: event.year_start,
    },
    endTime: {
      minute: event.minute_end,
      hour: event.hour_end,
      day: event.day_end,
      month: event.month_end,
      year: event.year_end,
    },
    cronExpression: event.cron_expression,
    createdAt: event.created_at,
    deletedAt: event.deleted_at,
  };
}
