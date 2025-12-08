/**
 * Types related to group leadership
 * Based on the group_leaders table in the database
 */

/**
 * Represents a group leader from the database
 */
export interface GroupLeaders {
  gid: number;
  leadername: string;
  oldleadername: string;
}

/**
 * Represents a simplified view of a group leader
 */
export interface SimpleGroupLeader {
  groupId: number;
  leaderName: string;
  previousLeaderName: string;
}

/**
 * Converts a GroupLeaders object to a SimpleGroupLeader object
 */
export function toSimpleGroupLeader(leader: GroupLeaders): SimpleGroupLeader {
  return {
    groupId: leader.gid,
    leaderName: leader.leadername,
    previousLeaderName: leader.oldleadername,
  };
}
