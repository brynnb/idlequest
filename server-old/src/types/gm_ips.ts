/**
 * Types related to GM IP addresses
 * Based on the gm_ips table in the database
 */

/**
 * Represents a GM IP entry from the database
 */
export interface GMIPs {
  name: string;
  account_id: number;
  ip_address: string;
}

/**
 * Represents a simplified view of a GM IP entry
 */
export interface SimpleGMIP {
  name: string;
  accountId: number;
  ipAddress: string;
}

/**
 * Converts a GMIPs object to a SimpleGMIP object
 */
export function toSimpleGMIP(gmIP: GMIPs): SimpleGMIP {
  return {
    name: gmIP.name,
    accountId: gmIP.account_id,
    ipAddress: gmIP.ip_address,
  };
}
