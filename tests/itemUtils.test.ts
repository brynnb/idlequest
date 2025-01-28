import { describe, it, expect, beforeEach, vi } from "vitest";
import { formatPrice } from "../src/utils/itemUtils";
import { useInventoryActions } from "../src/hooks/useInventoryActions";
import usePlayerCharacterStore from "../src/stores/PlayerCharacterStore";
import { InventorySlot } from "../src/entities/InventorySlot";
import { getBagStartingSlot } from "../src/utils/inventoryUtils";

vi.mock("../src/stores/PlayerCharacterStore");
vi.mock("../src/hooks/useInventorySelling", () => ({
  useInventorySelling: () => ({
    sellItem: vi.fn(),
  }),
}));

vi.mock("../src/utils/inventoryUtils", () => ({
  getBagStartingSlot: (slot: number) => {
    if (slot === 23) return 262;
    if (slot === InventorySlot.Cursor) return 342;
    if (slot === 24) return 272;
    return 0;
  },
}));

describe("formatPrice", () => {
  it("formats copper into correct denominations", () => {
    expect(formatPrice(1234)).toBe("1p 2g 3s 4c");
    expect(formatPrice(5000)).toBe("5p 0g 0s 0c");
    expect(formatPrice(99)).toBe("0p 0g 9s 9c");
    expect(formatPrice(0)).toBe("0p 0g 0s 0c");
  });
});

describe("Bag movement tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update bag contents when moving a bag with items", () => {
    const mockSetInventory = vi.fn();
    const mockSwapItems = vi.fn();
    const mockMoveItemToSlot = vi
      .fn()
      .mockImplementation((fromSlot, toSlot) => {
        const currentInventory =
          usePlayerCharacterStore.getState().characterProfile.inventory;
        const inventory = currentInventory.map((item) => {
          if (item.slotid === fromSlot) {
            return { ...item, slotid: toSlot };
          }
          const fromBagStart = getBagStartingSlot(fromSlot);
          const toBagStart = getBagStartingSlot(toSlot);
          if (item.slotid >= fromBagStart && item.slotid < fromBagStart + 8) {
            const relativeSlot = item.slotid - fromBagStart;
            return { ...item, slotid: toBagStart + relativeSlot };
          }
          return item;
        });
        mockSetInventory(inventory);
      });

    const mockInventory = [
      // Bag in slot 23
      {
        itemid: 1,
        slotid: 23,
        charges: 1,
        itemDetails: {
          itemclass: 1,
          bagslots: 8,
          Name: "Small Bag",
        },
      },
      // Item inside the bag in slot 262 (first slot of bag in slot 23)
      {
        itemid: 2,
        slotid: 262,
        charges: 1,
        itemDetails: {
          Name: "Item in Bag",
        },
      },
    ];

    (
      usePlayerCharacterStore.getState as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      characterProfile: {
        inventory: mockInventory,
        class: { bitmask: 1 },
        race: { bitmask: 1 },
      },
      setInventory: mockSetInventory,
      swapItems: mockSwapItems,
      moveItemToSlot: mockMoveItemToSlot,
      updateArmorClass: vi.fn(),
    });

    const { handleItemClick } = useInventoryActions();

    // First pick up the bag
    handleItemClick(23 as InventorySlot);

    // Verify first move to cursor
    expect(mockMoveItemToSlot).toHaveBeenCalledWith(23, InventorySlot.Cursor);

    // Verify inventory state after moving to cursor
    expect(mockSetInventory).toHaveBeenCalledWith([
      {
        itemid: 1,
        slotid: InventorySlot.Cursor,
        charges: 1,
        itemDetails: {
          itemclass: 1,
          bagslots: 8,
          Name: "Small Bag",
        },
      },
      {
        itemid: 2,
        slotid: 342, // First slot of cursor bag
        charges: 1,
        itemDetails: {
          Name: "Item in Bag",
        },
      },
    ]);

    // Update mock inventory to reflect bag in cursor
    const mockInventoryWithBagInCursor = [
      {
        itemid: 1,
        slotid: InventorySlot.Cursor,
        charges: 1,
        itemDetails: {
          itemclass: 1,
          bagslots: 8,
          Name: "Small Bag",
        },
      },
      {
        itemid: 2,
        slotid: 342,
        charges: 1,
        itemDetails: {
          Name: "Item in Bag",
        },
      },
    ];

    (
      usePlayerCharacterStore.getState as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      characterProfile: {
        inventory: mockInventoryWithBagInCursor,
        class: { bitmask: 1 },
        race: { bitmask: 1 },
      },
      setInventory: mockSetInventory,
      swapItems: mockSwapItems,
      moveItemToSlot: mockMoveItemToSlot,
      updateArmorClass: vi.fn(),
    });

    // Then move bag from cursor to slot 24
    handleItemClick(24 as InventorySlot);

    // Verify the final move
    expect(mockMoveItemToSlot).toHaveBeenCalledWith(InventorySlot.Cursor, 24);

    // Verify the final inventory state
    expect(mockSetInventory).toHaveBeenCalledWith([
      {
        itemid: 1,
        slotid: 24,
        charges: 1,
        itemDetails: {
          itemclass: 1,
          bagslots: 8,
          Name: "Small Bag",
        },
      },
      {
        itemid: 2,
        slotid: 272, // First slot of bag in slot 24
        charges: 1,
        itemDetails: {
          Name: "Item in Bag",
        },
      },
    ]);
  });
});
