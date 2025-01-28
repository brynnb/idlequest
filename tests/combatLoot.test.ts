import { describe, test, expect, beforeEach, vi } from "vitest";
import { InventoryItem } from "../src/entities/InventoryItem";
import { InventorySlot } from "../src/entities/InventorySlot";

// Mock item details
const mockItems = {
  1001: {
    id: 1001,
    name: "Cloth Cap",
    slot: 0, // Not equipped yet
    ac: 2,
    itemclass: "0", // Must be a string to match the real item type
    itemtype: "10", // Type 10 (Armor) as a string
    slots: 4, // Head slot bitmask
    classes: 65535, // All classes
    races: 65535, // All races
  },
  1429: {
    id: 1429,
    name: "Snow Griffin Egg",
    slot: 0,
    ac: 0,
    itemclass: "0",
    itemtype: "17", // CommonInventoryItem
  },
  1046: {
    id: 1046,
    name: "Shackle Key",
    slot: 0,
    ac: 0,
    itemclass: "0",
    itemtype: "33", // Keys
  },
};

// Create a mock store state
const mockStoreState = {
  characterProfile: {
    inventory: [] as InventoryItem[],
    class: { id: 1, bitmask: 1 }, // Warrior
    race: { id: 1, bitmask: 1 }, // Human
  },
};

// Mock all the stores and utilities
vi.mock("../src/utils/databaseOperations", () => ({
  getItemById: vi.fn((id) =>
    Promise.resolve(mockItems[id as keyof typeof mockItems])
  ),
}));

vi.mock("../src/stores/ChatStore", () => ({
  default: {
    getState: vi.fn(() => ({
      addMessage: vi.fn(),
    })),
  },
}));

vi.mock("../src/stores/GameStatusStore", () => ({
  default: {
    getState: vi.fn(() => ({
      autoSellEnabled: false,
      setAutoSellEnabled: vi.fn(),
    })),
  },
}));

vi.mock("../src/stores/PlayerCharacterStore", () => ({
  default: {
    getState: vi.fn(() => ({
      characterProfile: mockStoreState.characterProfile,
      addInventoryItem: vi.fn(async (item: InventoryItem) => {
        const existingItemIndex =
          mockStoreState.characterProfile.inventory.findIndex(
            (invItem) => invItem.slotid === item.slotid
          );
        if (existingItemIndex !== -1) {
          mockStoreState.characterProfile.inventory[existingItemIndex] = item;
        } else {
          mockStoreState.characterProfile.inventory.push(item);
        }
      }),
      setInventory: vi.fn((inventory: InventoryItem[]) => {
        mockStoreState.characterProfile.inventory = inventory;
      }),
      clearInventory: vi.fn(() => {
        mockStoreState.characterProfile.inventory = [];
      }),
      updateAllStats: vi.fn(),
    })),
  },
}));

vi.mock("../src/hooks/useInventorySelling", () => ({
  useInventorySelling: () => ({
    sellItem: vi.fn(),
  }),
}));

vi.mock("../src/entities/InventorySlot", async () => {
  const actual = await vi.importActual<
    typeof import("../src/entities/InventorySlot")
  >("../src/entities/InventorySlot");
  return {
    ...actual,
    SlotBitmasks: {
      0: 1, // Charm
      1: 2, // Ear1
      2: 4, // Head
      3: 8, // Face
      4: 16, // Ear2
      5: 32, // Neck
      6: 64, // Shoulders
      7: 128, // Arms
      8: 256, // Back
      9: 512, // Wrist1
      10: 1024, // Wrist2
      11: 2048, // Range
      12: 4096, // Hands
      13: 8192, // Primary
      14: 16384, // Secondary
      15: 32768, // Finger1
      16: 65536, // Finger2
      17: 131072, // Chest
      18: 262144, // Legs
      19: 524288, // Feet
      20: 1048576, // Waist
      21: 2097152, // PowerSource
      22: 4194304, // Ammo
    },
  };
});

vi.mock("../src/entities/ItemType", () => ({
  EQUIPPABLE_ITEM_TYPES: [10], // Include Type 10 (Armor)
  ItemType: {
    Armor: 10,
  },
}));

vi.mock("../src/utils/getItemScore", () => ({
  default: vi.fn((item) => {
    // Return a high score for the cloth cap to ensure it gets equipped
    if (item.id === 1001) return 100;
    return 0;
  }),
}));

vi.mock("../src/utils/itemUtils", () => ({
  isEquippableItem: vi.fn((item) => item.itemtype === "10"),
  isEquippableWithClass: vi.fn(() => true),
  isEquippableWithRace: vi.fn(() => true),
  getEquippableSlots: vi.fn((item) => {
    // For the cloth cap, return the head slot
    if (item.id === 1001) return [2];
    return [];
  }),
  findFirstAvailableGeneralSlot: vi.fn(() => 23),
}));

describe("Combat Loot Tests", () => {
  beforeEach(() => {
    mockStoreState.characterProfile.inventory = [];
    vi.clearAllMocks();
  });

  test("defeating enemy adds loot to inventory and auto-equips gear", async () => {
    const { useInventoryActions } = await import(
      "../src/hooks/useInventoryActions"
    );
    const { handleLoot } = useInventoryActions();

    // Verify inventory starts empty
    expect(mockStoreState.characterProfile.inventory).toHaveLength(0);

    // Simulate getting loot from enemy
    const lootItems = [
      { id: 1001 }, // cloth cap
      { id: 1429 }, // snow griffin egg
      { id: 1046 }, // shackle key
    ];

    // Use the real loot handling logic
    await handleLoot(lootItems);

    // Verify cloth cap is equipped in head slot
    const equippedHead = mockStoreState.characterProfile.inventory.find(
      (item) => item.slotid === InventorySlot.Head
    );
    expect(equippedHead?.itemid).toBe(1001);

    // Verify other items are in general inventory slots
    const slot23Item = mockStoreState.characterProfile.inventory.find(
      (item) => item.slotid === 23
    );
    expect(slot23Item?.itemid).toBe(1429);

    const slot24Item = mockStoreState.characterProfile.inventory.find(
      (item) => item.slotid === 24
    );
    expect(slot24Item?.itemid).toBe(1046);
  });
});
