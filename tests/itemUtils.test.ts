import { describe, it, expect, beforeEach, vi } from "vitest";
import { formatPrice } from "../src/utils/itemUtils";
import { handleItemClick } from "../src/hooks/useInventoryActions";
import usePlayerCharacterStore from "../src/stores/PlayerCharacterStore";
import { InventorySlot } from "../src/entities/InventorySlot";

vi.mock("../src/stores/PlayerCharacterStore");

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
    const mockMoveItemToSlot = vi.fn();

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

    // First pick up the bag
    handleItemClick(23 as InventorySlot);

    // Verify first move to cursor
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
        slotid: 272,
        charges: 1,
        itemDetails: {
          Name: "Item in Bag",
        },
      },
    ]);

    expect(mockMoveItemToSlot).toHaveBeenCalledWith(InventorySlot.Cursor, 24);
  });
});
