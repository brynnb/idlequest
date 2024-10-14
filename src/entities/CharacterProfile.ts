import { InventoryItem } from "./InventoryItem";
import Zone from "./Zone";

export default interface CharacterProfile {
  id?: number;
  accountId?: number;
  forumId?: number;
  name?: string;
  lastName?: string;
  title?: string;
  suffix?: string;
  zoneId?: number;
  position?: {
    x?: number;
    y?: number;
    z?: number;
    heading?: number;
  };
  gender?: number;
  weightAllowance?: number;
  race?: number;
  class?: number;
  level?: number;
  deity?: number;
  birthday?: number;
  lastLogin?: number;
  timePlayed?: number;
  level2?: number;
  anon?: number;
  gm?: number;
  appearance?: {
    face?: number;
    hairColor?: number;
    hairStyle?: number;
    beard?: number;
    beardColor?: number;
    eyeColor1?: number;
    eyeColor2?: number;
  };

  exp?: number;
  aaPointsSpent?: number;
  aaExp?: number;
  aaPoints?: number;
  points?: number;
  curHp?: number;
  maxHp?: number;
  curMana?: number;
  maxMana?: number;
  endurance?: number;
  intoxication?: number;
  attributes?: {
    str?: number;
    sta?: number;
    cha?: number;
    dex?: number;
    int?: number;
    agi?: number;
    wis?: number;
  };
  stats?: {
    ac?: number;
    atk?: number;
  };
  zoneChangeCount?: number;
  hungerLevel?: number;
  thirstLevel?: number;
  pvpStatus?: number;
  airRemaining?: number;
  autosplitEnabled?: number;
  mailkey?: string;
  firstLogon?: number;
  eAaEffects?: number;
  ePercentToAa?: number;
  eExpendedAaSpent?: number;
  boatId?: number;
  boatName?: string | null;
  famished?: number;
  isDeleted?: number;
  showHelm?: number;
  fatigue?: number;
  inventory?: InventoryItem[];
  startingZone?: Zone;
  platinum?: number;
  gold?: number;
  silver?: number;
  copper?: number;
}
