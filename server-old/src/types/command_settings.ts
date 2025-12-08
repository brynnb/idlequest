/**
 * Types related to command settings
 * Based on the command_settings table in the database
 */

/**
 * Represents a command setting from the database
 */
export interface CommandSettings {
  command: string;
  access: number;
  aliases: string;
}

/**
 * Represents a simplified view of a command setting
 */
export interface SimpleCommandSetting {
  command: string;
  accessLevel: number;
  aliases: string[];
}

/**
 * Converts a CommandSettings object to a SimpleCommandSetting object
 */
export function toSimpleCommandSetting(
  commandSetting: CommandSettings
): SimpleCommandSetting {
  return {
    command: commandSetting.command,
    accessLevel: commandSetting.access,
    aliases: commandSetting.aliases ? commandSetting.aliases.split("|") : [],
  };
}
