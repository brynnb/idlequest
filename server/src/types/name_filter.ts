/**
 * Types related to name filtering
 * Based on the name_filter table in the database
 */

/**
 * Represents a filtered name from the database
 */
export interface NameFilter {
  name: string;
}

/**
 * Represents a simplified view of a filtered name
 */
export interface SimpleFilteredName {
  name: string;
}

/**
 * Converts a NameFilter object to a SimpleFilteredName object
 */
export function toSimpleFilteredName(filter: NameFilter): SimpleFilteredName {
  return {
    name: filter.name,
  };
}
