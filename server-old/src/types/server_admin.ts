/**
 * Types related to server admin registration
 * Based on the tblServerAdminRegistration table in the database
 */

/**
 * Represents a server admin registration from the database
 */
export interface ServerAdminRegistration {
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
 * Represents a simplified view of a server admin
 */
export interface SimpleServerAdmin {
  id: number;
  accountName: string;
  firstName: string;
  lastName: string;
  email: string;
  registrationDate: Date;
  registrationIp: string;
}

/**
 * Converts a ServerAdminRegistration object to a SimpleServerAdmin object
 */
export function toSimpleServerAdmin(
  admin: ServerAdminRegistration
): SimpleServerAdmin {
  return {
    id: admin.ServerAdminID,
    accountName: admin.AccountName,
    firstName: admin.FirstName,
    lastName: admin.LastName,
    email: admin.Email,
    registrationDate: new Date(admin.RegistrationDate),
    registrationIp: admin.RegistrationIPAddr,
  };
}
