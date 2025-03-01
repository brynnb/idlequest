/**
 * Types related to guilds
 */

export interface Guild {
  id: number;
  name: string;
  leader: number;
  minstatus: number;
  motd: string;
  tribute: number;
  motd_setter: string;
  channel: string;
  url: string;
}

export interface GuildRank {
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

export interface GuildMember {
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
