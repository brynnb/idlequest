/**
 * Types related to banned IPs
 * Based on the banned_ips table in the database
 */

/**
 * Represents a banned IP from the database
 */
export interface BannedIPs {
  ip_address: string;
  notes: string | null;
}

/**
 * Represents a simplified view of a banned IP
 */
export interface SimpleBannedIP {
  ipAddress: string;
  notes: string | null;
}

/**
 * Converts a BannedIPs object to a SimpleBannedIP object
 */
export function toSimpleBannedIP(bannedIP: BannedIPs): SimpleBannedIP {
  return {
    ipAddress: bannedIP.ip_address,
    notes: bannedIP.notes,
  };
}
