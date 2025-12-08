/**
 * Types related to web interface server data
 * Based on the webdata_servers table in the database
 */

/**
 * Represents a web server data entry from the database
 */
export interface WebdataServers {
  id: number;
  name: string | null;
  connected: number;
}

/**
 * Represents a simplified view of a web server data entry
 */
export interface SimpleWebServer {
  id: number;
  name: string | null;
  isConnected: boolean;
}

/**
 * Converts a WebdataServers object to a SimpleWebServer object
 */
export function toSimpleWebServer(server: WebdataServers): SimpleWebServer {
  return {
    id: server.id,
    name: server.name,
    isConnected: server.connected === 1,
  };
}
