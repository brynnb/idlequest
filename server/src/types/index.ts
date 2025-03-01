/**
 * Index file for all types
 */

export * from "./message.js";
export * from "./account.js";
export * from "./character.js";
export * from "./guild.js";
export * from "./item.js";
export * from "./spell.js";
export * from "./alternate_ability.js";
export * from "./character_bind.js";
export * from "./character_corpse.js";
export * from "./login_account.js";
export * from "./world_server.js";
export * from "./launcher.js";
export * from "./login.js";

// Re-export with renamed types to avoid conflicts
export {
  DBCharacterCurrency,
  SimpleCurrency,
  CurrencyLocations,
  toCurrencyLocations,
} from "./character_currency.js";

// New account-related types with renamed exports
export {
  AccountFlags as DBAccountFlags,
  SimpleAccountFlags,
  toSimpleAccountFlags,
} from "./account_flags.js";

export {
  AccountIP as DBAccountIP,
  SimpleAccountIP,
  toSimpleAccountIP,
} from "./account_ip.js";

export {
  AccountRewards as DBAccountRewards,
  SimpleAccountReward,
  toSimpleAccountReward,
} from "./account_rewards.js";

// New character-related types with renamed exports
export {
  CharacterInventory as DBCharacterInventory,
  SimpleInventoryItem,
  toSimpleInventoryItem,
} from "./character_inventory.js";

export {
  CharacterSkills as DBCharacterSkills,
  SimpleSkill,
  toSimpleSkill,
} from "./character_skills.js";

export {
  CharacterSpells as DBCharacterSpells,
  SimpleSpell,
  toSimpleSpell,
} from "./character_spells.js";

export {
  CharacterBuffs as DBCharacterBuffs,
  SimpleBuff,
  toSimpleBuff,
} from "./character_buffs.js";

export {
  CharacterConsent as DBCharacterConsent,
  SimpleConsent,
  toSimpleConsent,
} from "./character_consent.js";

// New character-related types with renamed exports (added)
export {
  CharacterKeyring as DBCharacterKeyring,
  SimpleKeyringItem,
  toSimpleKeyringItem,
} from "./character_keyring.js";

export {
  CharacterLanguages as DBCharacterLanguages,
  SimpleLanguage,
  toSimpleLanguage,
} from "./character_languages.js";

export {
  CharacterFactionValues as DBCharacterFactionValues,
  SimpleFactionValue,
  toSimpleFactionValue,
} from "./character_faction_values.js";

export {
  CharacterMemmedSpells as DBCharacterMemmedSpells,
  SimpleMemmedSpell,
  toSimpleMemmedSpell,
} from "./character_memmed_spells.js";

export {
  CharacterTimers as DBCharacterTimers,
  SimpleTimer,
  toSimpleTimer,
} from "./character_timers.js";

export {
  CharacterInspectMessages as DBCharacterInspectMessages,
  SimpleInspectMessage,
  toSimpleInspectMessage,
} from "./character_inspect_messages.js";

export {
  CharacterPetBuffs as DBCharacterPetBuffs,
  SimplePetBuff,
  toSimplePetBuff,
} from "./character_pet_buffs.js";

export {
  CharacterPetInfo as DBCharacterPetInfo,
  SimplePetInfo,
  toSimplePetInfo,
} from "./character_pet_info.js";

export {
  CharacterPetInventory as DBCharacterPetInventory,
  SimplePetInventoryItem,
  toSimplePetInventoryItem,
} from "./character_pet_inventory.js";

export {
  CharacterZoneFlags as DBCharacterZoneFlags,
  SimpleZoneFlag,
  toSimpleZoneFlag,
} from "./character_zone_flags.js";

// New character-related types with renamed exports (newly added)
export {
  CharacterCorpseItem as DBCharacterCorpseItem,
  SimpleCorpseItem,
  toSimpleCorpseItem,
} from "./character_corpse_items.js";

export {
  CharacterLookup as DBCharacterLookup,
  SimpleCharacterLookup,
  toSimpleCharacterLookup,
} from "./character_lookup.js";

export {
  CharacterSoulmark as DBCharacterSoulmark,
  SimpleSoulmark,
  toSimpleSoulmark,
} from "./character_soulmarks.js";

// New guild-related types with renamed exports
export {
  GuildRanks as DBGuildRanks,
  SimpleGuildRank,
  toSimpleGuildRank,
} from "./guild_ranks.js";

export {
  GuildMembers as DBGuildMembers,
  SimpleGuildMember,
  toSimpleGuildMember,
} from "./guild_members.js";

// New player-related types with renamed exports
export {
  Friends as DBFriends,
  FriendType,
  SimpleFriend,
  toSimpleFriend,
} from "./friends.js";

export {
  Mail as DBMail,
  MailStatus,
  SimpleMailMessage,
  toSimpleMailMessage,
} from "./mail.js";

export {
  PlayerTitlesets as DBPlayerTitlesets,
  SimpleTitleSet,
  toSimpleTitleSet,
} from "./player_titlesets.js";

export {
  Trader as DBTrader,
  SimpleTraderItem,
  toSimpleTraderItem,
} from "./trader.js";

export {
  MerchantlistTemp as DBMerchantlistTemp,
  SimpleMerchantItem,
  toSimpleMerchantItem,
} from "./merchantlist_temp.js";

// New login server types with renamed exports
export {
  ServerAdminRegistration,
  SimpleServerAdmin,
  toSimpleServerAdmin,
} from "./server_admin.js";

export {
  ServerListType as DBServerListType,
  SimpleServerListType,
  toSimpleServerListType,
} from "./server_list_type.js";

// Login server types from the new login.ts file
export {
  TblLoginServerAccounts as DBLoginServerAccounts,
  SimpleLoginAccount,
  toSimpleLoginAccount,
  TblServerAdminRegistration as DBServerAdminRegistration,
  TblServerListType as DBServerListTypeTable,
  TblWorldServerRegistration as DBWorldServerRegistration,
  SimpleWorldServer,
  toSimpleWorldServer,
  TblAccountAccessLog as DBAccountAccessLog,
  SimpleAccountAccessLog,
  toSimpleAccountAccessLog,
} from "./login.js";

// New system tables types
export {
  BannedIPs as DBBannedIPs,
  SimpleBannedIP,
  toSimpleBannedIP,
} from "./banned_ips.js";

export {
  RuleValues as DBRuleValues,
  SimpleRuleValue,
  toSimpleRuleValue,
} from "./rule_values.js";

export {
  Variables as DBVariables,
  SimpleVariable,
  toSimpleVariable,
} from "./variables.js";

// New data tables types
export {
  CommandSettings,
  SimpleCommandSetting,
  toSimpleCommandSetting,
} from "./command_settings.js";

export {
  LogsysCategories,
  SimpleLogCategory,
  toSimpleLogCategory,
} from "./logsys_categories.js";

export { RuleSets, SimpleRuleSet, toSimpleRuleSet } from "./rule_sets.js";

// New bug/report system types
export { Bugs as DBBugs, SimpleBugReport, toSimpleBugReport } from "./bugs.js";

export {
  Reports as DBReports,
  SimpleReport,
  toSimpleReport,
} from "./reports.js";

export {
  Petitions as DBPetitions,
  SimplePetition,
  toSimplePetition,
} from "./petitions.js";

// New chat/social system types
export {
  ChatChannels as DBChatChannels,
  SimpleChatChannel,
  toSimpleChatChannel,
} from "./chatchannels.js";

export {
  NameFilter as DBNameFilter,
  SimpleFilteredName,
  toSimpleFilteredName,
} from "./name_filter.js";

// New group/raid management types
export {
  GroupId as DBGroupId,
  SimpleGroupMember,
  toSimpleGroupMember,
} from "./group_id.js";

export {
  GroupLeaders as DBGroupLeaders,
  SimpleGroupLeader,
  toSimpleGroupLeader,
} from "./group_leaders.js";

export {
  RaidDetails as DBRaidDetails,
  SimpleRaidDetails,
  toSimpleRaidDetails,
} from "./raid_details.js";

export {
  RaidMembers as DBRaidMembers,
  SimpleRaidMember,
  toSimpleRaidMember,
} from "./raid_members.js";

// New data storage types
export {
  DataBuckets as DBDataBuckets,
  SimpleDataBucket,
  toSimpleDataBucket,
} from "./data_buckets.js";

export {
  ObjectContents as DBObjectContents,
  SimpleObjectContent,
  toSimpleObjectContent,
} from "./object_contents.js";

export {
  QuestGlobals as DBQuestGlobals,
  SimpleQuestGlobal,
  toSimpleQuestGlobal,
} from "./quest_globals.js";

export {
  SpellGlobals as DBSpellGlobals,
  SimpleSpellGlobal,
  toSimpleSpellGlobal,
} from "./spell_globals.js";

// New logging/tracking types
export {
  EventLog as DBEventLog,
  SimpleEventLog,
  toSimpleEventLog,
} from "./eventlog.js";

export {
  CommandsLog as DBCommandsLog,
  SimpleCommandLog,
  toSimpleCommandLog,
} from "./commands_log.js";

// New server management types
export {
  ClientVersion as DBClientVersion,
  SimpleClientVersion,
  toSimpleClientVersion,
} from "./client_version.js";

// New web interface types
export {
  WebdataCharacter as DBWebdataCharacter,
  SimpleWebCharacter,
  toSimpleWebCharacter,
} from "./webdata_character.js";

export {
  WebdataServers as DBWebdataServers,
  SimpleWebServer,
  toSimpleWebServer,
} from "./webdata_servers.js";

// New tracking/logging types
export {
  RespawnTimes as DBRespawnTimes,
  SimpleRespawnTime,
  toSimpleRespawnTime,
} from "./respawn_times.js";

export {
  DiscoveredItems as DBDiscoveredItems,
  SimpleDiscoveredItem,
  toSimpleDiscoveredItem,
} from "./discovered_items.js";

export { GMIPs as DBGMIPs, SimpleGMIP, toSimpleGMIP } from "./gm_ips.js";

export {
  Hackers as DBHackers,
  SimpleHacker,
  toSimpleHacker,
} from "./hackers.js";

// New server management types
export {
  ServerScheduledEvents as DBServerScheduledEvents,
  SimpleScheduledEvent,
  toSimpleScheduledEvent,
} from "./server_scheduled_events.js";

// Quest statistics types
export {
  QSPlayerEvents as DBQSPlayerEvents,
  SimplePlayerEvent,
  toSimplePlayerEvent,
} from "./qs_player_events.js";

// Common enums and types

export enum CharacterClass {
  WARRIOR = 1,
  CLERIC = 2,
  PALADIN = 3,
  RANGER = 4,
  SHADOWKNIGHT = 5,
  DRUID = 6,
  MONK = 7,
  BARD = 8,
  ROGUE = 9,
  SHAMAN = 10,
  NECROMANCER = 11,
  WIZARD = 12,
  MAGICIAN = 13,
  ENCHANTER = 14,
  BEASTLORD = 15,
  BERSERKER = 16,
}

export enum CharacterRace {
  HUMAN = 1,
  BARBARIAN = 2,
  ERUDITE = 3,
  WOOD_ELF = 4,
  HIGH_ELF = 5,
  DARK_ELF = 6,
  HALF_ELF = 7,
  DWARF = 8,
  TROLL = 9,
  OGRE = 10,
  HALFLING = 11,
  GNOME = 12,
  IKSAR = 128,
  VAH_SHIR = 130,
  FROGLOK = 330,
  DRAKKIN = 522,
}

export enum CharacterGender {
  MALE = 0,
  FEMALE = 1,
  NEUTRAL = 2,
}

export enum ZoneID {
  // Common zones
  NEXUS = 152,
  PLANE_OF_KNOWLEDGE = 202,
  GUILD_HALL = 345,
  BAZAAR = 151,
  // Add more as needed
}
