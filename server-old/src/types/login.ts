/**
 * Types related to login server accounts and server registration
 * Based on the login tables in the database
 */

/**
 * Represents a login server account from the database
 */
export interface TblLoginServerAccounts {
  LoginServerID: number;
  AccountName: string;
  AccountPassword: string;
  AccountCreateDate: string;
  AccountEmail: string;
  LastLoginDate: string;
  LastIPAddress: string;
  created_by: number;
  client_unlock: number;
  creationIP: string;
  ForumName: string;
  max_accts: number;
  Num_IP_Bypass: number;
  lastpass_change: number | null;
}

/**
 * Represents a simplified view of a login server account
 */
export interface SimpleLoginAccount {
  id: number;
  accountName: string;
  password: string;
  createDate: string;
  email: string;
  lastLoginDate: string;
  lastIpAddress: string;
  createdBy: number;
  clientUnlock: boolean;
  creationIp: string;
  forumName: string;
  maxAccounts: number;
  ipBypassCount: number;
  lastPasswordChange: number | null;
}

/**
 * Converts a TblLoginServerAccounts object to a SimpleLoginAccount object
 */
export function toSimpleLoginAccount(
  account: TblLoginServerAccounts
): SimpleLoginAccount {
  return {
    id: account.LoginServerID,
    accountName: account.AccountName,
    password: account.AccountPassword,
    createDate: account.AccountCreateDate,
    email: account.AccountEmail,
    lastLoginDate: account.LastLoginDate,
    lastIpAddress: account.LastIPAddress,
    createdBy: account.created_by,
    clientUnlock: account.client_unlock === 1,
    creationIp: account.creationIP,
    forumName: account.ForumName,
    maxAccounts: account.max_accts,
    ipBypassCount: account.Num_IP_Bypass,
    lastPasswordChange: account.lastpass_change,
  };
}

/**
 * Represents a server admin registration from the database
 */
export interface TblServerAdminRegistration {
  ServerAdminID: number;
  AccountName: string;
  AccountPassword: string;
  FirstName: string;
  LastName: string;
  Email: string;
  RegistrationDate: string;
  RegistrationIPAddr: string;
}

/**
 * Represents a simplified view of a server admin registration
 */
export interface SimpleServerAdmin {
  id: number;
  accountName: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  registrationDate: string;
  registrationIp: string;
}

/**
 * Converts a TblServerAdminRegistration object to a SimpleServerAdmin object
 */
export function toSimpleServerAdmin(
  admin: TblServerAdminRegistration
): SimpleServerAdmin {
  return {
    id: admin.ServerAdminID,
    accountName: admin.AccountName,
    password: admin.AccountPassword,
    firstName: admin.FirstName,
    lastName: admin.LastName,
    email: admin.Email,
    registrationDate: admin.RegistrationDate,
    registrationIp: admin.RegistrationIPAddr,
  };
}

/**
 * Represents a server list type from the database
 */
export interface TblServerListType {
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
 * Converts a TblServerListType object to a SimpleServerListType object
 */
export function toSimpleServerListType(
  type: TblServerListType
): SimpleServerListType {
  return {
    id: type.ServerListTypeID,
    description: type.ServerListTypeDescription,
  };
}

/**
 * Represents a world server registration from the database
 */
export interface TblWorldServerRegistration {
  ServerID: number;
  ServerLongName: string;
  ServerTagDescription: string;
  ServerShortName: string;
  ServerListTypeID: number;
  ServerLastLoginDate: string | null;
  ServerLastIPAddr: string | null;
  ServerAdminID: number;
  ServerTrusted: number;
  Note: string | null;
}

/**
 * Represents a simplified view of a world server registration
 */
export interface SimpleWorldServer {
  id: number;
  longName: string;
  tagDescription: string;
  shortName: string;
  listTypeId: number;
  lastLoginDate: string | null;
  lastIpAddress: string | null;
  adminId: number;
  trusted: boolean;
  note: string | null;
}

/**
 * Converts a TblWorldServerRegistration object to a SimpleWorldServer object
 */
export function toSimpleWorldServer(
  server: TblWorldServerRegistration
): SimpleWorldServer {
  return {
    id: server.ServerID,
    longName: server.ServerLongName,
    tagDescription: server.ServerTagDescription,
    shortName: server.ServerShortName,
    listTypeId: server.ServerListTypeID,
    lastLoginDate: server.ServerLastLoginDate,
    lastIpAddress: server.ServerLastIPAddr,
    adminId: server.ServerAdminID,
    trusted: server.ServerTrusted === 1,
    note: server.Note,
  };
}

/**
 * Represents an account access log entry from the database
 */
export interface TblAccountAccessLog {
  id: number;
  account_id: number;
  account_name: string;
  IP: string;
  accessed: number;
  SQL_Time: string;
  reason: string | null;
}

/**
 * Represents a simplified view of an account access log entry
 */
export interface SimpleAccountAccessLog {
  id: number;
  accountId: number;
  accountName: string;
  ipAddress: string;
  accessedTimestamp: number;
  sqlTime: string;
  reason: string | null;
}

/**
 * Converts a TblAccountAccessLog object to a SimpleAccountAccessLog object
 */
export function toSimpleAccountAccessLog(
  log: TblAccountAccessLog
): SimpleAccountAccessLog {
  return {
    id: log.id,
    accountId: log.account_id,
    accountName: log.account_name,
    ipAddress: log.IP,
    accessedTimestamp: log.accessed,
    sqlTime: log.SQL_Time,
    reason: log.reason,
  };
}
