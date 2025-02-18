import CharacterProfile from "@entities/CharacterProfile";
import classes from "@data/json/classes.json";
import races from "@data/json/races.json";
import deities from "@data/json/deities.json";
import zones from "@data/json/zones.json";
import { InventoryItem } from "@entities/InventoryItem";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import CharacterClass from "@entities/CharacterClass";
import { Item } from "@entities/Item";

export const GENERAL_SLOTS = [23, 24, 25, 26, 27, 28, 29, 30];

export const createBasicCharacterProfile = (
  overrides: Partial<CharacterProfile> = {}
): CharacterProfile => ({
  name: "TestCharacter",
  race: races.find((r) => r.name === "Barbarian"),
  class: classes[0] as CharacterClass,
  deity: deities[0].id,
  zoneId: zones[0].zoneidnumber,
  level: 1,
  exp: 0,
  weightAllowance: 100,
  attributes: {
    str: 75,
    sta: 75,
    cha: 75,
    dex: 75,
    int: 75,
    agi: 75,
    wis: 75,
  },
  intoxication: 0,
  maxHp: 100,
  curHp: 100,
  maxMana: 100,
  curMana: 100,
  stats: {
    ac: 0,
    atk: 100,
  },
  inventory: [],
  ...overrides,
});

export const createMockInventoryItem = (
  itemId: number,
  slotId: number,
  itemDetails: Partial<Item> = {}
): InventoryItem => ({
  itemid: itemId,
  slotid: slotId,
  charges: itemDetails.maxcharges || 0,
  itemDetails: {
    id: itemId,
    name: `Test Item ${itemId}`,
    itemclass: 0,
    ...itemDetails,
  },
});

export const createMockLootCallbacks = () => ({
  setInventory: async (inventory: InventoryItem[]) => {
    usePlayerCharacterStore.setState((state) => ({
      characterProfile: {
        ...state.characterProfile,
        inventory,
      },
    }));
  },
  addChatMessage: () => {
    // No-op for test
  },
});
