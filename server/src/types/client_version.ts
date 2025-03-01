/**
 * Types related to client version tracking
 * Based on the client_version table in the database
 */

/**
 * Represents a client version entry from the database
 */
export interface ClientVersion {
  account_id: number;
  version_: number;
}

/**
 * Represents a simplified view of a client version entry
 */
export interface SimpleClientVersion {
  accountId: number;
  version: number;
}

/**
 * Converts a ClientVersion object to a SimpleClientVersion object
 */
export function toSimpleClientVersion(
  clientVersion: ClientVersion
): SimpleClientVersion {
  return {
    accountId: clientVersion.account_id,
    version: clientVersion.version_,
  };
}
