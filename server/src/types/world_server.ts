/**
 * World Server Types
 * Based on the tblWorldServerRegistration table in the database
 */

/**
 * Represents a world server registration
 */
export interface WorldServerRegistration {
  ServerID: number;
  ServerLongName: string;
  ServerTagDescription: string;
  ServerShortName: string;
  ServerListTypeID: number;
}

/**
 * Enum for server list types
 */
export enum ServerListType {
  NORMAL = 1,
  PREFERRED = 2,
  DEVELOPMENT = 3,
  TEST = 4,
}

/**
 * Represents a simplified view of a world server
 */
export interface SimpleWorldServer {
  id: number;
  name: string;
  description: string;
  short_name: string;
  type: ServerListType;
}

/**
 * Converts a WorldServerRegistration to a SimpleWorldServer
 */
export function toSimpleWorldServer(
  server: WorldServerRegistration
): SimpleWorldServer {
  return {
    id: server.ServerID,
    name: server.ServerLongName,
    description: server.ServerTagDescription,
    short_name: server.ServerShortName,
    type: server.ServerListTypeID as ServerListType,
  };
}
