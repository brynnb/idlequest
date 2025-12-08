/**
 * Types related to guild members
 * Based on the guild_members table in the database
 */

/**
 * Represents a guild member from the database
 */
export interface GuildMembers {
  char_id: number;
  guild_id: number;
  rank: number;
  tribute_enable: number;
  total_tribute: number;
  last_tribute: number;
  banker: number;
  public_note: string;
  alt: number;
}

/**
 * Represents a simplified view of a guild member
 */
export interface SimpleGuildMember {
  characterId: number;
  guildId: number;
  rank: number;
  isTributeEnabled: boolean;
  totalTribute: number;
  lastTributeTime: number;
  isBanker: boolean;
  publicNote: string;
  isAlt: boolean;
}

/**
 * Converts a GuildMembers object to a SimpleGuildMember object
 */
export function toSimpleGuildMember(
  guildMember: GuildMembers
): SimpleGuildMember {
  return {
    characterId: guildMember.char_id,
    guildId: guildMember.guild_id,
    rank: guildMember.rank,
    isTributeEnabled: guildMember.tribute_enable === 1,
    totalTribute: guildMember.total_tribute,
    lastTributeTime: guildMember.last_tribute,
    isBanker: guildMember.banker === 1,
    publicNote: guildMember.public_note,
    isAlt: guildMember.alt === 1,
  };
}
