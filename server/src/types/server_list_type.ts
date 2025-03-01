/**
 * Types related to server list types
 * Based on the tblServerListType table in the database
 */

/**
 * Represents a server list type from the database
 */
export interface ServerListType {
  ServerListTypeID: number;
  ServerListTypeDescription: string;
}

/**
 * Represents a simplified view of a server list type
 */
export interface SimpleServerListType {
  id: number;
  description: string;
}

/**
 * Converts a ServerListType object to a SimpleServerListType object
 */
export function toSimpleServerListType(
  serverListType: ServerListType
): SimpleServerListType {
  return {
    id: serverListType.ServerListTypeID,
    description: serverListType.ServerListTypeDescription,
  };
}
