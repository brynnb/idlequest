/**
 * Types related to account IP addresses
 * Based on the account_ip table in the database
 */

/**
 * Represents an account IP address from the database
 */
export interface AccountIP {
  account_id: number;
  ip: string;
  count: number;
  lastused: string;
}

/**
 * Represents a simplified view of account IP addresses
 */
export interface SimpleAccountIP {
  ip: string;
  count: number;
  lastUsed: Date;
}

/**
 * Converts an AccountIP object to a SimpleAccountIP object
 */
export function toSimpleAccountIP(accountIP: AccountIP): SimpleAccountIP {
  return {
    ip: accountIP.ip,
    count: accountIP.count,
    lastUsed: new Date(accountIP.lastused),
  };
}
