/**
 * Types related to account flags
 * Based on the account_flags table in the database
 */

/**
 * Represents an account flag from the database
 */
export interface AccountFlags {
  account_id: number;
  flag: string;
  value: string;
}

/**
 * Represents a simplified view of account flags
 */
export interface SimpleAccountFlags {
  flag: string;
  value: string;
}

/**
 * Converts an AccountFlags object to a SimpleAccountFlags object
 */
export function toSimpleAccountFlags(
  accountFlags: AccountFlags
): SimpleAccountFlags {
  return {
    flag: accountFlags.flag,
    value: accountFlags.value,
  };
}
