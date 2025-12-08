/**
 * Types related to chat channels
 * Based on the chatchannels table in the database
 */

/**
 * Represents a chat channel from the database
 */
export interface ChatChannels {
  name: string;
  owner: string;
  password: string;
  minstatus: number;
}

/**
 * Represents a simplified view of a chat channel
 */
export interface SimpleChatChannel {
  name: string;
  owner: string;
  password: string;
  minStatus: number;
}

/**
 * Converts a ChatChannels object to a SimpleChatChannel object
 */
export function toSimpleChatChannel(channel: ChatChannels): SimpleChatChannel {
  return {
    name: channel.name,
    owner: channel.owner,
    password: channel.password,
    minStatus: channel.minstatus,
  };
}
