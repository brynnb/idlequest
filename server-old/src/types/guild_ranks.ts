/**
 * Types related to guild ranks
 * Based on the guild_ranks table in the database
 */

/**
 * Represents a guild rank from the database
 */
export interface GuildRanks {
  guild_id: number;
  rank: number;
  title: string;
  can_hear: number;
  can_speak: number;
  can_invite: number;
  can_remove: number;
  can_promote: number;
  can_demote: number;
  can_motd: number;
  can_warpeace: number;
}

/**
 * Represents a simplified view of a guild rank
 */
export interface SimpleGuildRank {
  guildId: number;
  rankLevel: number;
  title: string;
  permissions: {
    canHear: boolean;
    canSpeak: boolean;
    canInvite: boolean;
    canRemove: boolean;
    canPromote: boolean;
    canDemote: boolean;
    canMotd: boolean;
    canWarPeace: boolean;
  };
}

/**
 * Converts a GuildRanks object to a SimpleGuildRank object
 */
export function toSimpleGuildRank(guildRank: GuildRanks): SimpleGuildRank {
  return {
    guildId: guildRank.guild_id,
    rankLevel: guildRank.rank,
    title: guildRank.title,
    permissions: {
      canHear: guildRank.can_hear === 1,
      canSpeak: guildRank.can_speak === 1,
      canInvite: guildRank.can_invite === 1,
      canRemove: guildRank.can_remove === 1,
      canPromote: guildRank.can_promote === 1,
      canDemote: guildRank.can_demote === 1,
      canMotd: guildRank.can_motd === 1,
      canWarPeace: guildRank.can_warpeace === 1,
    },
  };
}
