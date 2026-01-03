import { InventoryItem } from "./InventoryItem";
import { CharacterAttributes } from "./CharacterAttributes";
import { CharacterStats } from "./CharacterStats";
import Zone from "./Zone";
import CharacterClass from "./CharacterClass";
import Race from "./Race";
import Deity from "./Deity";

// Updated to match Go server's CharacterData model
export default interface CharacterProfile {
  // Core character data (matching Go server exactly)
  id?: number;                    // ID (primary key)
  accountId?: number;             // AccountID  
  name?: string;                  // Name
  lastName?: string;              // LastName
  title?: string;                 // Title
  suffix?: string;                // Suffix
  zoneId?: number;                // ZoneID
  zoneInstance?: number;          // ZoneInstance

  // Position data
  x?: number;                     // X
  y?: number;                     // Y  
  z?: number;                     // Z
  heading?: number;               // Heading

  // Basic character info
  gender?: number;                // Gender
  race?: Race;                    // Race object
  class?: CharacterClass;         // Class object
  level?: number;                 // Level
  deity?: Deity;                  // Deity object
  birthday?: number;              // Birthday
  lastLogin?: number;             // LastLogin
  timePlayed?: number;            // TimePlayed
  anon?: number;                  // Anon
  gm?: number;                    // Gm
  face?: number;                  // Face

  // Abilities and timers
  abilityTimeSeconds?: number;    // AbilityTimeSeconds
  abilityNumber?: number;         // AbilityNumber
  abilityTimeMinutes?: number;    // AbilityTimeMinutes
  abilityTimeHours?: number;      // AbilityTimeHours

  // Experience and points
  exp?: number;                   // Exp
  expEnabled?: number;            // ExpEnabled
  aaPointsSpent?: number;         // AaPointsSpent
  aaExp?: number;                 // AaExp
  aaPoints?: number;              // AaPoints
  points?: number;                // Points

  // Health/Mana/Endurance
  curHp?: number;                 // CurHp
  maxHp?: number;                 // Calculated client-side
  mana?: number;                  // Mana (curMana equivalent)
  maxMana?: number;               // Calculated client-side  
  endurance?: number;             // Endurance
  intoxication?: number;          // Intoxication

  // Base attributes (from Go server)
  str?: number;                   // Str
  sta?: number;                   // Sta
  cha?: number;                   // Cha
  dex?: number;                   // Dex
  int?: number;                   // Int
  agi?: number;                   // Agi
  wis?: number;                   // Wis
  extraHaste?: number;            // ExtraHaste

  // Game state
  zoneChangeCount?: number;       // ZoneChangeCount
  toxicity?: number;              // Toxicity
  hungerLevel?: number;           // HungerLevel
  thirstLevel?: number;           // ThirstLevel
  abilityUp?: number;             // AbilityUp
  showHelm?: number;              // ShowHelm

  // Social settings
  groupAutoConsent?: number;      // GroupAutoConsent
  raidAutoConsent?: number;       // RaidAutoConsent
  guildAutoConsent?: number;      // GuildAutoConsent

  // Other game mechanics
  restTimer?: number;             // RestTimer
  airRemaining?: number;          // AirRemaining
  autosplitEnabled?: number;      // AutosplitEnabled
  lfp?: number;                   // Lfp (Looking for Party)
  lfg?: number;                   // Lfg (Looking for Group)
  mailkey?: string;               // Mailkey
  xtargets?: number;              // Xtargets
  firstLogon?: number;            // Firstlogon

  // Advanced AA
  eAaEffects?: number;            // EAaEffects
  ePercentToAa?: number;          // EPercentToAa
  eExpendedAaSpent?: number;      // EExpendedAaSpent
  aaPointsSpentOld?: number;      // AaPointsSpentOld
  aaPointsOld?: number;           // AaPointsOld

  // Special states
  deletedAt?: string | null;      // DeletedAt (timestamp)
  illusionBlock?: number;         // IllusionBlock

  // Tradeskills (all from Go server)
  wind?: number;                  // Wind (instrument skill)
  brass?: number;                 // Brass (instrument skill)
  string?: number;                // String (instrument skill) 
  percussion?: number;            // Percussion (instrument skill)
  singing?: number;               // Singing
  baking?: number;                // Baking
  alchemy?: number;               // Alchemy
  tailoring?: number;             // Tailoring
  blacksmithing?: number;         // Blacksmithing
  fletching?: number;             // Fletching
  brewing?: number;               // Brewing
  jewelry?: number;               // Jewelry
  pottery?: number;               // Pottery
  research?: number;              // Research
  alcohol?: number;               // Alcohol tolerance
  fishing?: number;               // Fishing
  tinkering?: number;             // Tinkering

  // Skills array (indexed by Skill enum) - for combat skills
  skills?: number[];

  // Client-side computed fields (keep for backward compatibility)
  stats?: CharacterStats;
  attributes?: CharacterAttributes; // Computed from str/sta/cha/etc
  totalAttributes?: CharacterAttributes; // With item bonuses
  inventory?: InventoryItem[];
  startingZone?: Zone;

  // Currency (may be separate or computed)
  platinum?: number;
  gold?: number;
  silver?: number;
  copper?: number;
  weight?: number;
  weightAllowance?: number;

  // Legacy fields for backward compatibility
  appearance?: {
    face?: number;
    hairColor?: number;
    hairStyle?: number;
    beard?: number;
    beardColor?: number;
    eyeColor1?: number;
    eyeColor2?: number;
  };

  // Deprecated/legacy fields
  forumId?: number;
  level2?: number;
  pvpStatus?: number;
  boatId?: number;
  boatName?: string | null;
  famished?: number;
  isDeleted?: number;
  fatigue?: number;
  position?: {
    x?: number;
    y?: number;
    z?: number;
    heading?: number;
  };
}
