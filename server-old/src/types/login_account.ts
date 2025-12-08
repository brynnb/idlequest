/**
 * Login Server Account Types
 * Based on the tblLoginServerAccounts table in the database
 */

/**
 * Represents a login server account
 */
export interface LoginServerAccount {
  LoginServerID: number;
  AccountName: string;
  AccountPassword: string;
  AccountCreateDate: string; // timestamp
  AccountEmail: string;
  LastLoginDate: string; // datetime
  LastIPAddress: string;
  created_by: number;
  client_unlock: boolean;
  creationIP: string;
  ForumName: string;
  max_accts: number;
  Num_IP_Bypass: number | null;
  lastpass_change: number | null;
}

/**
 * Represents a simplified view of a login server account
 */
export interface SimpleLoginAccount {
  id: number;
  username: string;
  email: string;
  created_at: string;
  last_login: string;
  forum_name: string;
}

/**
 * Converts a LoginServerAccount to a SimpleLoginAccount
 */
export function toSimpleLoginAccount(
  account: LoginServerAccount
): SimpleLoginAccount {
  return {
    id: account.LoginServerID,
    username: account.AccountName,
    email: account.AccountEmail,
    created_at: account.AccountCreateDate,
    last_login: account.LastLoginDate,
    forum_name: account.ForumName,
  };
}
