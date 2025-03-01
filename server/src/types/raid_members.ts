/**
 * Types related to raid membership
 * Based on the raid_members table in the database
 */

/**
 * Represents a raid member from the database
 */
export interface RaidMembers {
  raidid: number;
  charid: number;
  groupid: number;
  _class: number;
  level: number;
  name: string;
  isgroupleader: number;
  israidleader: number;
  islooter: number;
}

/**
 * Represents a simplified view of a raid member
 */
export interface SimpleRaidMember {
  raidId: number;
  characterId: number;
  groupId: number;
  characterClass: number;
  level: number;
  name: string;
  isGroupLeader: boolean;
  isRaidLeader: boolean;
  isLooter: boolean;
}

/**
 * Converts a RaidMembers object to a SimpleRaidMember object
 */
export function toSimpleRaidMember(member: RaidMembers): SimpleRaidMember {
  return {
    raidId: member.raidid,
    characterId: member.charid,
    groupId: member.groupid,
    characterClass: member._class,
    level: member.level,
    name: member.name,
    isGroupLeader: member.isgroupleader === 1,
    isRaidLeader: member.israidleader === 1,
    isLooter: member.islooter === 1,
  };
}
