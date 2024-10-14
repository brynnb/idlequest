export default interface Race {
  name: string;
  short_name?: string;
  bitmask?: number;
  id: number;
  no_coin: number;
}

export enum RaceId {
  Human = 1,
  Barbarian = 2,
  Erudite = 3,
  WoodElf = 4,
  HighElf = 5,
  DarkElf = 6,
  HalfElf = 7,
  Dwarf = 8,
  Troll = 9,
  Ogre = 10,
  Halfling = 11,
  Gnome = 12,
  Iksar = 128,
}
