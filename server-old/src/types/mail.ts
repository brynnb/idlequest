/**
 * Types related to mail system
 * Based on the mail table in the database
 */

/**
 * Represents a mail message from the database
 */
export interface Mail {
  msgid: number;
  charid: number;
  timestamp: number;
  from: string;
  subject: string;
  body: string;
  to: string;
  status: number;
}

/**
 * Mail status enum
 */
export enum MailStatus {
  UNREAD = 0,
  READ = 1,
  DELETED = 2,
}

/**
 * Represents a simplified view of a mail message
 */
export interface SimpleMailMessage {
  messageId: number;
  characterId: number;
  timestamp: number;
  sender: string;
  subject: string;
  body: string;
  recipient: string;
  status: MailStatus;
}

/**
 * Converts a Mail object to a SimpleMailMessage object
 */
export function toSimpleMailMessage(mail: Mail): SimpleMailMessage {
  return {
    messageId: mail.msgid,
    characterId: mail.charid,
    timestamp: mail.timestamp,
    sender: mail.from,
    subject: mail.subject,
    body: mail.body,
    recipient: mail.to,
    status: mail.status as MailStatus,
  };
}
