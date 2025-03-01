/**
 * Types related to items
 */

export interface Item {
  id: number;
  minstatus: number;
  Name: string;
  aagi: number;
  ac: number;
  acha: number;
  adex: number;
  aint: number;
  asta: number;
  astr: number;
  awis: number;
  bagsize: number;
  bagslots: number;
  bagtype: number;
  bagwr: number;
  banedmgamt: number;
  banedmgbody: number;
  banedmgrace: number;
  bardtype: number;
  bardvalue: number;
  book: number;
  casttime: number;
  casttime_: number;
  classes: number;
  color: number;
  price: number;
  cr: number;
  damage: number;
  deity: number;
  delay: number;
  dr: number;
  clicktype: number;
  clicklevel2: number;
  elemdmgtype: number;
  elemdmgamt: number;
  factionamt1: number;
  factionamt2: number;
  factionamt3: number;
  factionamt4: number;
  factionmod1: number;
  factionmod2: number;
  factionmod3: number;
  factionmod4: number;
  filename: string;
  focuseffect: number;
  fr: number;
  fvnodrop: number;
  clicklevel: number;
  hp: number;
  icon: number;
  idfile: string;
  itemclass: number;
  itemtype: number;
  light: number;
  lore: string;
  magic: number;
  mana: number;
  material: number;
  maxcharges: number;
  mr: number;
  nodrop: number;
  norent: number;
  pr: number;
  procrate: number;
  races: number;
  range: number;
  reclevel: number;
  recskill: number;
  reqlevel: number;
  sellrate: number;
  size: number;
  skillmodtype: number;
  skillmodvalue: number;
  slots: number;
  clickeffect: number;
  tradeskills: number;
  weight: number;
  booktype: number;
  recastdelay: number;
  recasttype: number;
  updated: string;
  comment: string;
  stacksize: number;
  stackable: number;
  proceffect: number;
  proctype: number;
  proclevel2: number;
  proclevel: number;
  worneffect: number;
  worntype: number;
  wornlevel: number;
  wornlevel2: number;
  focustype: number;
  focuslevel: number;
  focuslevel2: number;
}

export enum ItemType {
  NORMAL = 0,
  CONTAINER = 1,
  BOOK = 2,
  ARMOR = 3,
  WEAPON = 4,
  POTION = 5,
  FOOD = 6,
  DRINK = 7,
  KEY = 8,
  COIN = 9,
  SCROLL = 10,
  TRADESKILL = 11,
  AUGMENTATION = 12,
}

export enum ItemSlot {
  HEAD = 1,
  FACE = 2,
  EARS = 4,
  NECK = 8,
  SHOULDERS = 16,
  ARMS = 32,
  BACK = 64,
  WRIST = 128,
  HANDS = 256,
  PRIMARY = 512,
  SECONDARY = 1024,
  FINGERS = 2048,
  CHEST = 4096,
  LEGS = 8192,
  FEET = 16384,
  WAIST = 32768,
  AMMO = 65536,
  RANGE = 131072,
}
