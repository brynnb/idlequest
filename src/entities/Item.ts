import { ItemSize } from "./ItemSize";

export interface Item {
  id?: number; // Unique Item Identifier
  description?: string; // Adding this for when we import a description form a spell for a spell scroll
  minstatus?: number; // Minimum Status
  name?: string; // Name
  aagi?: number; // Agility: -128 to 127
  ac?: number; // Armor Class
  accuracy?: number; // Accuracy
  acha?: number; // Charisma: -128 to 127
  adex?: number; // Dexterity: -128 to 127
  aint?: number; // Intelligence: -128 to 127
  artifactflag?: number; // Artifact: 0 = False, 1 = True
  asta?: number; // Stamina: -128 to 127
  astr?: number; // Strength: -128 to 127
  attack?: number; // Attack
  augrestrict?: number; // Augment Restriction
  augslot1type?: number; // Augment Slot 1 Type
  augslot1visible?: number; // Augment Slot 1 Visible: 0 = False, 1 = True
  augslot2type?: number; // Augment Slot 2 Type
  augslot2visible?: number; // Augment Slot 2 Visible: 0 = False, 1 = True
  augslot3type?: number; // Augment Slot 3 Type
  augslot3visible?: number; // Augment Slot 3 Visible: 0 = False, 1 = True
  augslot4type?: number; // Augment Slot 4 Type
  augslot4visible?: number; // Augment Slot 4 Visible: 0 = False, 1 = True
  augslot5type?: number; // Augment Slot 5 Type
  augslot5visible?: number; // Augment Slot 5 Visible: 0 = False, 1 = True
  augslot6type?: number; // Augment Slot 6 Type
  augslot6visible?: number; // Augment Slot 6 Visible: 0 = False, 1 = True
  augtype?: number; // Augment Type
  avoidance?: number; // Avoidance
  awis?: number; // Wisdom: -128 to 127
  bagsize?: ItemSize; // Bag Size
  bagslots?: number; // Bag Slots: 1 = Minimum, 10 = Maximum
  bagtype?: number; // Bag Type
  bagwr?: number; // Bag Weight Reduction: 0 = 0%, 100 = 100%
  banedmgamt?: number; // Bane Damage Amount
  banedmgraceamt?: number; // Bane Damage Race Amount
  banedmgbody?: number; // Bane Damage Body Type
  banedmgrace?: number; // Bane Damage Race
  bardtype?: number; // Bard Type
  bardvalue?: number; // Bard Value
  book?: number; // Book
  casttime?: number; // Cast Time in Seconds
  casttime_?: number; // Cast Time in Seconds
  charmfile?: string; // Charm File
  charmfileid?: string; // Charm File Identifier
  classes?: number; // Classes
  color?: number; // Color
  combateffects?: string; // Combat Effects
  extradmgskill?: number; // Extra Damage Skill
  extradmgamt?: number; // Extra Damage Amount
  price?: number; // Price in Copper
  cr?: number; // Cold Resistance: -128 to 127
  damage?: number; // Damage
  damageshield?: number; // Damage Shield
  deity?: number; // Deity
  delay?: number; // Delay
  augdistiller?: number; // Augment Distiller Item Identifier
  dotshielding?: number; // Damage Over Time Shielding
  dr?: number; // Disease Resistance: -128 to 127
  clicktype?: number; // Click Type
  clicklevel2?: number; // Click Level 2
  elemdmgtype?: number; // Elemental Damage Type
  elemdmgamt?: number; // Elemental Damage Amount
  endur?: number; // Endurance
  factionamt1?: number; // Faction Amount 1
  factionamt2?: number; // Faction Amount 2
  factionamt3?: number; // Faction Amount 3
  factionamt4?: number; // Faction Amount 4
  factionmod1?: number; // Faction Modifier 1
  factionmod2?: number; // Faction Modifier 2
  factionmod3?: number; // Faction Modifier 3
  factionmod4?: number; // Faction Modifier 4
  filename?: string; // File Name
  focuseffect?: number; // Focus Effect Identifier
  fr?: number; // Fire Resistance: -128 to 127
  fvnodrop?: number; // Firiona Vie No Drop: 0 = False, 1 = True
  haste?: number; // Haste: 0 = 0%, 255 = 255%
  clicklevel?: number; // Click Level
  hp?: number; // Health
  regen?: number; // Health Regeneration
  icon?: number; // Icon
  idfile?: string; // Item Texture
  itemclass?: number; // Item Class
  itemtype?: number; // Item Type
  ldonprice?: number; // LDoN Price
  ldontheme?: number; // LDoN Theme
  ldonsold?: number; // LDoN Sold: 0 = False, 1 = True
  light?: number; // Light
  lore?: string; // Lore Description, starts with a "*" if it's lore
  loregroup?: number; // Lore Group - this seems to be missing from the alkabor database i'm getting my data from, can't find any reason online why this would be the case
  magic?: number; // Magic: 0 = False, 1 = True
  mana?: number; // Mana
  manaregen?: number; // Mana Regeneration
  enduranceregen?: number; // Endurance Regeneration
  material?: number; // Material
  herosforgemodel?: number; // Hero's Forge Model
  maxcharges?: number; // Maximum Charges
  mr?: number; // Magic Resistance: -128 to 127
  nodrop?: number; // No Drop: 0 = True, 1 = False
  norent?: number; // No Rent: 0 = True, 1 = False
  pendingloreflag?: number; // Pending Lore Flag: 0 = False, 1 = True
  pr?: number; // Poison Resistance: -128 to 127
  procrate?: number; // Proc Rate: 0 = 100%, 50 = 150%, 100 = 200%
  races?: number; // Races
  range?: number; // Range: 0 to 255
  reclevel?: number; // Recommended Level
  recskill?: number; // Recommended Skill Level
  reqlevel?: number; // Required Level
  sellrate?: number; // Sell Rate - this is multipled times the price for when a vendor is selling the item, but not a player is selling to a vendor. Used to ensure players couldn't make money in automated ways, or for balance reasons
  shielding?: number; // Shielding: 5 = 5%, 20 = 20%, 50 = 50%
  size?: ItemSize; // Size
  skillmodtype?: number; // Skill Modifier Type
  skillmodvalue?: number; // Skill Modifier Value
  slots?: number; // Slots
  clickeffect?: number; // Click Effect Identifier
  spellshield?: number; // Spell Shielding
  strikethrough?: number; // Strikethrough
  stunresist?: number; // Stun Resist
  summonedflag?: number; // Unknown
  tradeskills?: number; // Tradeskill Item: 0 = False, 1= True
  favor?: number; // Favor
  weight?: number; // Weight: 10 = 1.0, 25 = 2.5, 100 = 10.0
  UNK012?: number; // Unknown
  UNK013?: number; // Unknown
  benefitflag?: number; // Unknown
  UNK054?: number; // Unknown
  UNK059?: number; // Unknown
  booktype?: number; // Book Language
  recastdelay?: number; // Recast Delay in Seconds
  recasttype?: number; // Recast Type: -1 = None, >0 = Recast Type used across all items
  guildfavor?: number; // Guild Favor
  UNK123?: number; // Unknown
  UNK124?: number; // Unknown
  attuneable?: number; // Attuneable: 0 = False, 1 = True
  nopet?: number; // No Pet: 0 = False, 1 = True
  updated?: Date; // Updated Datetime
  comment?: string; // Comment
  UNK127?: number; // Unknown
  pointtype?: number; // Unknown
  potionbelt?: number; // Potion Belt: 0 = False, 1 = True
  potionbeltslots?: number; // Potion Belt Slots
  stacksize?: number; // Stack Size
  notransfer?: number; // No Transfer: 0 = False, 1 = True
  stackable?: number; // Stackable: 0 = False, 1 = True
  UNK134?: string; // Unknown
  UNK137?: number; // Unknown
  proceffect?: number; // Proc Effect Identifier
  proctype?: number; // Proc Type: 0
  proclevel2?: number; // Proc Level 2
  proclevel?: number; // Proc Level
  UNK142?: number; // Unknown
  worneffect?: number; // Worn Effect Identifier
  worntype?: number; // Worn Type: 2 = Worn
  wornlevel2?: number; // Worn Level 2
  wornlevel?: number; // Worn Level
  UNK147?: number; // Unknown
  focustype?: number; // Focus Type: 6 = Focus
  focuslevel2?: number; // Focus Level 2
  focuslevel?: number; // Focus Level
  UNK152?: number; // Unknown
  scrolleffect?: number; // Scroll Effect Identifier
  scrolltype?: number; // Scroll Type: 7 = Scroll
  scrolllevel2?: number; // Scroll Level 2
  scrolllevel?: number; // Scroll Level
  UNK157?: number; // Unknown
  serialized?: Date; // Serialized Datetime
  verified?: Date; // Verified Datetime
  serialization?: string; // Serialization
  source?: string; // Source
  UNK033?: number; // Unknown
  lorefile?: string; // Lore File
  UNK014?: number; // Unknown
  svcorruption?: number; // Corruption Resistance: -128 to 127
  skillmodmax?: number; // Skill Modifier Max
  UNK060?: number; // Unknown
  augslot1unk2?: number; // Unknown
  augslot2unk2?: number; // Unknown
  augslot3unk2?: number; // Unknown
  augslot4unk2?: number; // Unknown
  augslot5unk2?: number; // Unknown
  augslot6unk2?: number; // Unknown
  UNK120?: number; // Unknown
  UNK121?: number; // Unknown
  questitemflag?: number; // Quest Item: 0 = False, 1 = True
  UNK132?: string; // Unknown
  clickunk5?: number; // Unknown
  clickunk6?: string; // Unknown
  clickunk7?: number; // Unknown
  procunk1?: number; // Unknown
  procunk2?: number; // Unknown
  procunk3?: number; // Unknown
  procunk4?: number; // Unknown
  procunk6?: string; // Unknown
  procunk7?: string; // Unknown
  wornunk1?: number; // Unknown
  wornunk2?: number; // Unknown
  wornunk3?: number; // Unknown
  wornunk4?: number; // Unknown
  wornunk5?: number; // Unknown
  wornunk6?: string; // Unknown
  wornunk7?: string; // Unknown
  focusunk1?: number; // Unknown
  focusunk2?: number; // Unknown
  focusunk3?: number; // Unknown
  focusunk4?: number; // Unknown
  focusunk5?: number; // Unknown
  focusunk6?: string; // Unknown
  focusunk7?: string; // Unknown
  scrollunk1?: number; // Unknown
  scrollunk2?: number; // Unknown
  scrollunk3?: number; // Unknown
  scrollunk4?: number; // Unknown
  scrollunk5?: number; // Unknown
  scrollunk6?: string; // Unknown
  scrollunk7?: string; // Unknown
  UNK193?: number; // Unknown
  purity?: number; // Purity
  evoitem?: number; // Evolving Item: 0 = False, 1 = True
  evoid?: number; // Evolving Identifier
  evolvinglevel?: number; // Evolving Level
  evomax?: number; // Evolving Max
  clickname?: string; // Click Name
  procname?: string; // Proc Name
  wornname?: string; // Worn Name
  focusname?: string; // Focus Name
  scrollname?: string; // Scroll Name
  dsmitigation?: number; // Damage Shield Mitigation
  heroic_str?: number; // Heroic Strength
  heroic_int?: number; // Heroic Intelligence
  heroic_wis?: number; // Heroic Wisdom
  heroic_agi?: number; // Heroic Agility
  heroic_dex?: number; // Heroic Dexterity
  heroic_sta?: number; // Heroic Stamina
  heroic_cha?: number; // Heroic Charisma
  heroic_pr?: number; // Heroic Poison Resistance
  heroic_dr?: number; // Heroic Disease Resistance
  heroic_fr?: number; // Heroic Fire Resistance
  heroic_cr?: number; // Heroic Cold Resistance
  heroic_mr?: number; // Heroic Magic Resistance
  heroic_svcorrup?: number; // Heroic Corruption Resistance
  healamt?: number; // Heal Amount: 0 to 32767
  spelldmg?: number; // Spell Damage: 0 to 32767
  clairvoyance?: number; // Clairvoyance
  backstabdmg?: number; // Backstab Damage
  created?: string; // Created
  elitematerial?: number; // Elite Material
  ldonsellbackrate?: number; // LDoN Sellback Rate
  scriptfileid?: number; // Script File Name
  expendablearrow?: number; // Expendable Arrow: 0 = False, 1 = True
  powersourcecapacity?: number; // Powersource Capacity
  bardeffect?: number; // Bard Effect Identifier
  bardeffecttype?: number; // Bard Effect Type
  bardlevel2?: number; // Bard Level 2
  bardlevel?: number; // Bard Level
  bardunk1?: number; // Unknown
  bardunk2?: number; // Unknown
  bardunk3?: number; // Unknown
  bardunk4?: number; // Unknown
  bardunk5?: number; // Unknown
  bardname?: string; // Bard Name
  bardunk7?: number; // Unknown
  UNK214?: number; // Unknown
  subtype?: number; // Sub Type
  UNK220?: number; // Unknown
  UNK221?: number; // Unknown
  heirloom?: number; // Heirloom: 0 = False, 1 = True
  UNK223?: number; // Unknown
  UNK224?: number; // Unknown
  UNK225?: number; // Unknown
  UNK226?: number; // Unknown
  UNK227?: number; // Unknown
  UNK228?: number; // Unknown
  UNK229?: number; // Unknown
  UNK230?: number; // Unknown
  UNK231?: number; // Unknown
  UNK232?: number; // Unknown
  UNK233?: number; // Unknown
  UNK234?: number; // Unknown
  placeable?: number; // Placeable: 0 = False, 1 = True
  UNK236?: number; // Unknown
  UNK237?: number; // Unknown
  UNK238?: number; // Unknown
  UNK239?: number; // Unknown
  UNK240?: number; // Unknown
  UNK241?: number; // Unknown
  epicitem?: number; // Epic Item: 0 = False, 1 = True
}
