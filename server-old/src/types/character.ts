/**
 * Types related to game characters
 */

export interface CharacterData {
  id: number;
  account_id: number;
  name: string;
  last_name: string;
  title: string;
  suffix: string;
  zone_id: number;
  y: number;
  x: number;
  z: number;
  heading: number;
  gender: number;
  race: number;
  class: number;
  level: number;
  deity: number;
  birthday: number;
  last_login: number;
  time_played: number;
  level2: number;
  anon: number;
  gm: number;
  face: number;
  hair_color: number;
  hair_style: number;
  beard: number;
  beard_color: number;
  eye_color_1: number;
  eye_color_2: number;
  exp: number;
  aa_points_spent: number;
  aa_exp: number;
  aa_points: number;
  points: number;
  cur_hp: number;
  mana: number;
  endurance: number;
  intoxication: number;
  str: number;
  sta: number;
  cha: number;
  dex: number;
  int: number;
  agi: number;
  wis: number;
  zone_change_count: number;
  hunger_level: number;
  thirst_level: number;
  pvp_status: number;
  air_remaining: number;
  autosplit_enabled: number;
  mailkey: string;
  firstlogon: number;
  e_aa_effects: number;
  e_percent_to_aa: number;
  e_expended_aa_spent: number;
  boatid: number;
  boatname: string | null;
  famished: number;
  is_deleted: number;
  showhelm: number;
  fatigue: number | null;
}

export interface CharacterInventory {
  id: number;
  slotid: number;
  itemid: number | null;
  charges: number | null;
  custom_data: string | null;
  serialnumber: number;
  initialserial: number;
}

export interface CharacterSkills {
  id: number;
  skill_id: number;
  value: number;
}

export interface CharacterSpells {
  id: number;
  slot_id: number;
  spell_id: number;
}

export interface CharacterBuffs {
  character_id: number;
  slot_id: number;
  spell_id: number;
  caster_level: number;
  caster_name: string;
  ticsremaining: number;
  counters: number;
  numhits: number;
  melee_rune: number;
  magic_rune: number;
  persistent: number;
  dot_rune: number;
  caston_x: number;
  caston_y: number;
  caston_z: number;
  ExtraDIChance: number;
  instrument_mod: number;
}

export interface CharacterCurrency {
  id: number;
  platinum: number;
  gold: number;
  silver: number;
  copper: number;
  platinum_bank: number;
  gold_bank: number;
  silver_bank: number;
  copper_bank: number;
  platinum_cursor: number;
  gold_cursor: number;
  silver_cursor: number;
  copper_cursor: number;
  radiant_crystals: number;
  career_radiant_crystals: number;
  ebon_crystals: number;
  career_ebon_crystals: number;
}
