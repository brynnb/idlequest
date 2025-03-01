/**
 * Types related to friends list
 * Based on the friends table in the database
 */

/**
 * Represents a friend entry from the database
 */
export interface Friends {
  charid: number;
  type: number;
  name: string;
}

/**
 * Friend type enum
 */
export enum FriendType {
  IGNORE = 0,
  FRIEND = 1,
}

/**
 * Represents a simplified view of a friend entry
 */
export interface SimpleFriend {
  characterId: number;
  type: FriendType;
  name: string;
}

/**
 * Converts a Friends object to a SimpleFriend object
 */
export function toSimpleFriend(friend: Friends): SimpleFriend {
  return {
    characterId: friend.charid,
    type: friend.type === 1 ? FriendType.FRIEND : FriendType.IGNORE,
    name: friend.name,
  };
}
