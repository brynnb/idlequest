export default interface CharacterClass {
  id: number;
  bitmask: number | null;
  name: string;
  short_name?: string;
  spell_list_id: number | null;
  create_points: number;
  first_title: string;
  second_title: string;
  third_title: string;
}

export enum ClassId {
  Warrior = 1,
  Cleric = 2,
  Paladin = 3,
  Ranger = 4,
  ShadowKnight = 5,
  Druid = 6,
  Monk = 7,
  Bard = 8,
  Rogue = 9,
  Shaman = 10,
  Necromancer = 11,
  Wizard = 12,
  Magician = 13,
  Enchanter = 14,
  Beastlord = 15,
  Berserker = 16,
  Banker = 17,
  GMWarrior = 20,
  GMCleric = 21,
  GMPaladin = 22,
  GMRanger = 23,
  GMShadowKnight = 24,
  GMDruid = 25,
  GMMonk = 26,
  GMBard = 27,
  GMRogue = 28,
  GMShaman = 29,
  GMNecromancer = 30,
  GMWizard = 31,
  GMMagician = 32,
  GMEnchanter = 33,
  GMBeastlord = 34,
  GMBerserker = 35,
  Shopkeeper = 41,
  DiscordMerchant = 59,
  AdventureRecruiter = 60,
  AdventureMerchant = 61,
  TributeMaster = 63,
  GuildTributeMaster = 64,
  GuildBank = 66,
  RadiantCrystalMerchant = 67,
  EbonCrystalMerchant = 68,
  Fellowships = 69,
  AlternateCurrencyMerchant = 70,
  MercenaryMerchant = 71,
}
