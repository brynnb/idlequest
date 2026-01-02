import { Item } from "@entities/Item";
import {
  ItemType,
  getItemTypeName,
  EQUIPPABLE_ITEM_TYPES,
} from "@entities/ItemType";
import {
  InventorySlot,
  SlotBitmasks,
  getInventorySlotNames,
} from "@entities/InventorySlot";
import classesData from "@data/json/classes.json";
import racesData from "@data/json/races.json";
import Race from "@entities/Race";
import { InventoryItem } from "@entities/InventoryItem";
import CharacterClass from "@entities/CharacterClass";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";

export const getCharacterClass = (classId: number): CharacterClass | null => {
  const classData = classesData.find((c) => c.id === classId);
  if (!classData) return null;
  return classData as CharacterClass;
};

export const getCharacterRace = (raceId: number): Race | null => {
  const raceData = racesData.find((r) => r.id === raceId);
  if (!raceData) return null;
  return raceData as Race;
};

export const isSlotAvailableForItem = (
  item: InventoryItem,
  slot: InventorySlot,
  characterClass: CharacterClass,
  characterRace: Race,
  inventory: InventoryItem[]
): boolean => {
  // Allow cursor and general inventory slots (22-29)
  if (slot === InventorySlot.Cursor) return true;
  if (slot >= 22 && slot <= 29) return true;

  if (!item.itemDetails || item.itemDetails.slots === undefined) {
    return false;
  }

  // Check if trying to equip in secondary slot while having a 2H weapon equipped
  if (slot === InventorySlot.Secondary) {
    const primaryItem = inventory.find(
      (inv) => inv.bag === 0 && inv.slot === InventorySlot.Primary
    );
    if (
      primaryItem?.itemDetails?.itemtype !== undefined &&
      [1, 4, 35].includes(primaryItem.itemDetails.itemtype)
    ) {
      // Import dynamically to avoid circular dependencies
      import("@stores/ChatStore").then((module) => {
        module.default.getState().addMessage(
          "You cannot equip an off-hand item while wielding a two-handed weapon.",
          module.MessageType.SYSTEM
        );
      });
      return false;
    }
  }

  // Check if trying to equip a 2H weapon in primary while having something in secondary
  if (
    slot === InventorySlot.Primary &&
    item.itemDetails?.itemtype !== undefined &&
    [1, 4, 35].includes(item.itemDetails.itemtype)
  ) {
    const secondaryItem = inventory.find(
      (inv) => inv.bag === 0 && inv.slot === InventorySlot.Secondary
    );
    if (secondaryItem) {
      // Import dynamically to avoid circular dependencies
      import("@stores/ChatStore").then((module) => {
        module.default.getState().addMessage(
          "You cannot equip a two-handed weapon while holding an item in your off-hand.",
          module.MessageType.SYSTEM
        );
      });
      return false;
    }
  }

  const itemSlots = parseInt(item.itemDetails.slots.toString());
  const bitmask = SlotBitmasks[slot];
  if (bitmask === undefined) return false;
  const slotCheck = (itemSlots & bitmask) !== 0;
  const classCheck = isEquippableWithClass(item.itemDetails, characterClass);
  const raceCheck = isEquippableWithRace(item.itemDetails, characterRace);

  return slotCheck && classCheck && raceCheck;
};

export const isItemAllowedInSlot = (
  item: InventoryItem,
  slot: InventorySlot,
  characterClass: CharacterClass,
  characterRace: Race,
  inventory?: InventoryItem[]
): boolean => {
  return isSlotAvailableForItem(
    item,
    slot,
    characterClass,
    characterRace,
    inventory || []
  );
};

export const getSlotNames = (slots: number | undefined) => {
  if (slots === undefined) return "NONE";
  const slotNames = getInventorySlotNames(slots);
  return slotNames.length > 0 ? slotNames.join(" ") : "NONE";
};

export const getItemTypeNameWrapper = (itemtype: string | undefined) => {
  if (itemtype === undefined) return "UNKNOWN";
  return getItemTypeName(parseInt(itemtype) as ItemType);
};

export const getClassNames = (classes: number | undefined) => {
  if (classes === undefined) return "UNKNOWN";
  const classesBitmask = parseInt(classes.toString());

  // Get playable classes (first 14 in the list)
  const playableClasses = classesData.slice(0, 14);

  // Calculate the "ALL" bitmask dynamically by summing all playable class bitmasks
  const allClassesBitmask = playableClasses.reduce(
    (sum, classInfo) => sum + (classInfo.bitmask || 0),
    0
  );

  // Check if all playable classes are included, or if it's a common "ALL" value like 65535
  if (classesBitmask === 65535 || (classesBitmask & allClassesBitmask) === allClassesBitmask) {
    return "ALL";
  }

  const classNames = playableClasses
    .filter(
      (classInfo) => classInfo.bitmask && classesBitmask & classInfo.bitmask
    )
    .map((classInfo) => classInfo.short_name);

  return classNames.length > 0 ? classNames.join(" ") : "NONE";
};

export const getRaceNames = (races: number | undefined) => {
  if (races === undefined) return "UNKNOWN";
  const racesBitmask = parseInt(races.toString());

  // Get only playable races with valid bitmasks
  const playableRaces = racesData.filter(
    (race) => race.is_playable && race.short_name && race.bitmask !== undefined
  );

  // Calculate the "ALL" bitmask dynamically by summing all playable race bitmasks
  const allRacesBitmask = playableRaces.reduce(
    (sum, race) => sum + (race.bitmask || 0),
    0
  );

  // Check if all playable races are included, or if it's a common "ALL" value like 65535
  if (racesBitmask === 65535 || (racesBitmask & allRacesBitmask) === allRacesBitmask) {
    return "ALL";
  }

  const raceNames = playableRaces
    .filter((race) => race.bitmask !== undefined && racesBitmask & race.bitmask)
    .map((race) => race.short_name)
    .filter((name): name is string => name !== undefined);

  return raceNames.length > 0 ? raceNames.join(" ") : "NONE";
};

export const getStatString = (item: Item) => {
  const formatStat = (value: number | undefined, label: string) => {
    if (!value) return null;
    const sign = value >= 0 ? "+" : "-";
    return `${label} ${sign}${Math.abs(value)}`;
  };

  const stats = [
    formatStat(item.astr, "STR"),
    formatStat(item.asta, "STA"),
    formatStat(item.aagi, "AGI"),
    formatStat(item.adex, "DEX"),
    formatStat(item.awis, "WIS"),
    formatStat(item.aint, "INT"),
    formatStat(item.acha, "CHA"),
    formatStat(item.hp, "HP"),
    formatStat(item.mana, "MANA"),
    formatStat(item.endur, "ENDUR"),
    formatStat(item.fr, "FR"),
    formatStat(item.cr, "CR"),
    formatStat(item.dr, "DR"),
    formatStat(item.pr, "PR"),
    formatStat(item.mr, "MR"),
    formatStat(item.svcorruption, "SV CORRUPT"),
  ].filter(Boolean);
  return stats.join(" ");
};

export const isEquippableItem = (item: Item): boolean => {
  return (
    item.itemclass === 0 &&
    item.itemtype !== undefined &&
    EQUIPPABLE_ITEM_TYPES.includes(item.itemtype as ItemType)
  );
};

export const isSpellItem = (item: Item): boolean => {
  return item.itemtype === 20;
};

export const formatPrice = (copperPrice: number): string => {
  const platinum = Math.floor(copperPrice / 1000);
  const gold = Math.floor((copperPrice % 1000) / 100);
  const silver = Math.floor((copperPrice % 100) / 10);
  const copper = copperPrice % 10;

  return `${platinum}p ${gold}g ${silver}s ${copper}c`;
};

export const isEquippableWithClass = (
  item: Item,
  characterClass: CharacterClass
): boolean => {
  if (!item.classes || !characterClass.bitmask) {
    return false;
  }
  const itemClassesBitmask = parseInt(item.classes.toString());
  return (itemClassesBitmask & characterClass.bitmask) !== 0;
};

export const isEquippableWithRace = (
  item: Item,
  characterRace: Race
): boolean => {
  if (!item.races || !characterRace.bitmask) {
    return false;
  }
  const itemRacesBitmask = parseInt(item.races.toString());
  return (itemRacesBitmask & characterRace.bitmask) !== 0;
};

export const getEquippableSlots = (item: Item): number[] => {
  if (!item.slots) return [];
  const itemSlots = parseInt(item.slots.toString());
  return Object.entries(SlotBitmasks)
    .filter(
      ([slot, bitmask]) => (itemSlots & bitmask) !== 0 && parseInt(slot) < 23
    )
    .map(([slot]) => parseInt(slot));
};

export const findFirstAvailableGeneralSlot = (
  inventory: InventoryItem[]
): number | undefined => {
  // Check base slots (23 to 30) in bag=0 only
  for (let slot = 23; slot <= 30; slot++) {
    if (!inventory.some((item) => item.bag === 0 && item.slot === slot)) {
      return slot;
    }
  }

  return undefined;
};

export const findFirstAvailableSlotForItem = (
  inventory: InventoryItem[]
): number | undefined => {
  const { characterProfile } = usePlayerCharacterStore.getState();

  if (!characterProfile.class || !characterProfile.race) {
    console.warn(
      "Character class or race not found, cannot check slot availability"
    );
    return undefined;
  }

  // Check base slots (23 to 30) in bag=0 only
  for (let slot = 23; slot <= 30; slot++) {
    if (
      !inventory.some((invItem) => invItem.bag === 0 && invItem.slot === slot)
    ) {
      return slot;
    }
  }

  return undefined;
};
