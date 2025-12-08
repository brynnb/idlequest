/**
 * Types related to group membership
 * Based on the group_id table in the database
 */

/**
 * Represents a group member from the database
 */
export interface GroupId {
  groupid: number;
  charid: number;
  name: string;
  accountid: number;
}

/**
 * Represents a simplified view of a group member
 */
export interface SimpleGroupMember {
  groupId: number;
  characterId: number;
  characterName: string;
  accountId: number;
}

/**
 * Converts a GroupId object to a SimpleGroupMember object
 */
export function toSimpleGroupMember(member: GroupId): SimpleGroupMember {
  return {
    groupId: member.groupid,
    characterId: member.charid,
    characterName: member.name,
    accountId: member.accountid,
  };
}
