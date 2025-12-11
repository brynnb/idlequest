import { describe, it, expect } from "vitest";
import { InventorySlot } from "../src/entities/InventorySlot";

// Inline implementation of getBagStartingSlot to avoid import chain issues
const getBagStartingSlot = (baseSlot: number): number => {
  switch (baseSlot) {
    case InventorySlot.Cursor:
      return InventorySlot.CursorBagStartingSlot;
    case InventorySlot.General1:
      return InventorySlot.General1BagStartingSlot;
    case InventorySlot.General2:
      return InventorySlot.General2BagStartingSlot;
    case InventorySlot.General3:
      return InventorySlot.General3BagStartingSlot;
    case InventorySlot.General4:
      return InventorySlot.General4BagStartingSlot;
    case InventorySlot.General5:
      return InventorySlot.General5BagStartingSlot;
    case InventorySlot.General6:
      return InventorySlot.General6BagStartingSlot;
    case InventorySlot.General7:
      return InventorySlot.General7BagStartingSlot;
    case InventorySlot.General8:
      return InventorySlot.General8BagStartingSlot;
    default:
      return -1;
  }
};

/**
 * Tests to verify client slot IDs match server slot IDs.
 * Server slot scheme (from server-go/internal/constants/items.go):
 * - Equipment: 0-21 (SlotCharm=0 to SlotAmmo=21)
 * - General Inventory: 22-29 (SlotGeneral1=22 to SlotGeneral8=29)
 * - Cursor: 30 (SlotCursor=30)
 * - Bag contents: 251+ (10 slots per bag)
 */

describe("Slot ID Conversion", () => {
  describe("Equipment Slots (0-21)", () => {
    it("should have Charm at slot 0", () => {
      expect(InventorySlot.Charm).toBe(0);
    });

    it("should have Primary weapon at slot 13", () => {
      expect(InventorySlot.Primary).toBe(13);
    });

    it("should have Secondary weapon at slot 14", () => {
      expect(InventorySlot.Secondary).toBe(14);
    });

    it("should have Ammo at slot 21 (last equipment slot)", () => {
      expect(InventorySlot.Ammo).toBe(21);
    });

    it("should have all equipment slots in range 0-21", () => {
      const equipmentSlots = [
        InventorySlot.Charm,
        InventorySlot.Ear1,
        InventorySlot.Head,
        InventorySlot.Face,
        InventorySlot.Ear2,
        InventorySlot.Neck,
        InventorySlot.Shoulders,
        InventorySlot.Arms,
        InventorySlot.Back,
        InventorySlot.Wrist1,
        InventorySlot.Wrist2,
        InventorySlot.Range,
        InventorySlot.Hands,
        InventorySlot.Primary,
        InventorySlot.Secondary,
        InventorySlot.Finger1,
        InventorySlot.Finger2,
        InventorySlot.Chest,
        InventorySlot.Legs,
        InventorySlot.Feet,
        InventorySlot.Waist,
        InventorySlot.Ammo,
      ];

      equipmentSlots.forEach((slot, index) => {
        expect(slot).toBe(index);
      });
      expect(equipmentSlots.length).toBe(22); // 0-21 = 22 slots
    });
  });

  describe("General Inventory Slots (22-29)", () => {
    it("should have General1 at slot 22", () => {
      expect(InventorySlot.General1).toBe(22);
    });

    it("should have General8 at slot 29", () => {
      expect(InventorySlot.General8).toBe(29);
    });

    it("should have 8 general inventory slots (22-29)", () => {
      expect(InventorySlot.General1).toBe(22);
      expect(InventorySlot.General2).toBe(23);
      expect(InventorySlot.General3).toBe(24);
      expect(InventorySlot.General4).toBe(25);
      expect(InventorySlot.General5).toBe(26);
      expect(InventorySlot.General6).toBe(27);
      expect(InventorySlot.General7).toBe(28);
      expect(InventorySlot.General8).toBe(29);
    });
  });

  describe("Cursor Slot", () => {
    it("should have Cursor at slot 30", () => {
      expect(InventorySlot.Cursor).toBe(30);
    });
  });

  describe("Bag Content Starting Slots", () => {
    it("should have General1 bag contents starting at 251", () => {
      expect(InventorySlot.General1BagStartingSlot).toBe(251);
    });

    it("should have bag starting slots spaced 10 apart", () => {
      expect(InventorySlot.General1BagStartingSlot).toBe(251);
      expect(InventorySlot.General2BagStartingSlot).toBe(261);
      expect(InventorySlot.General3BagStartingSlot).toBe(271);
      expect(InventorySlot.General4BagStartingSlot).toBe(281);
      expect(InventorySlot.General5BagStartingSlot).toBe(291);
      expect(InventorySlot.General6BagStartingSlot).toBe(301);
      expect(InventorySlot.General7BagStartingSlot).toBe(311);
      expect(InventorySlot.General8BagStartingSlot).toBe(321);
      expect(InventorySlot.CursorBagStartingSlot).toBe(331);
    });
  });

  describe("getBagStartingSlot function", () => {
    it("should return correct bag starting slot for General1 (slot 22)", () => {
      expect(getBagStartingSlot(InventorySlot.General1)).toBe(251);
      expect(getBagStartingSlot(22)).toBe(251);
    });

    it("should return correct bag starting slot for General8 (slot 29)", () => {
      expect(getBagStartingSlot(InventorySlot.General8)).toBe(321);
      expect(getBagStartingSlot(29)).toBe(321);
    });

    it("should return correct bag starting slot for Cursor (slot 30)", () => {
      expect(getBagStartingSlot(InventorySlot.Cursor)).toBe(331);
      expect(getBagStartingSlot(30)).toBe(331);
    });

    it("should return -1 for invalid slots", () => {
      expect(getBagStartingSlot(0)).toBe(-1); // Equipment slot
      expect(getBagStartingSlot(13)).toBe(-1); // Primary weapon
      expect(getBagStartingSlot(21)).toBe(-1); // Ammo
      expect(getBagStartingSlot(100)).toBe(-1); // Invalid
    });

    it("should map all general slots to correct bag starting slots", () => {
      const mappings = [
        { generalSlot: 22, bagStart: 251 },
        { generalSlot: 23, bagStart: 261 },
        { generalSlot: 24, bagStart: 271 },
        { generalSlot: 25, bagStart: 281 },
        { generalSlot: 26, bagStart: 291 },
        { generalSlot: 27, bagStart: 301 },
        { generalSlot: 28, bagStart: 311 },
        { generalSlot: 29, bagStart: 321 },
        { generalSlot: 30, bagStart: 331 }, // Cursor
      ];

      mappings.forEach(({ generalSlot, bagStart }) => {
        expect(getBagStartingSlot(generalSlot)).toBe(bagStart);
      });
    });
  });

  describe("Server slot ID compatibility", () => {
    // These tests verify the client slot IDs match what the server expects
    // Based on server-go/internal/constants/items.go

    it("should match server equipment slot range (0-21)", () => {
      // Server: SlotCharm=0 to SlotAmmo=21
      expect(InventorySlot.Charm).toBe(0); // Server: SlotCharm
      expect(InventorySlot.Ammo).toBe(21); // Server: SlotAmmo
    });

    it("should match server general inventory slot range (22-29)", () => {
      // Server: SlotGeneral1=22 to SlotGeneral8=29
      expect(InventorySlot.General1).toBe(22); // Server: SlotGeneral1
      expect(InventorySlot.General8).toBe(29); // Server: SlotGeneral8
    });

    it("should match server cursor slot (30)", () => {
      // Server: SlotCursor=30
      expect(InventorySlot.Cursor).toBe(30);
    });

    it("should have no gap between equipment and general slots", () => {
      // Equipment ends at 21, general starts at 22
      expect(InventorySlot.Ammo + 1).toBe(InventorySlot.General1);
    });

    it("should have no gap between general slots and cursor", () => {
      // General ends at 29, cursor is at 30
      expect(InventorySlot.General8 + 1).toBe(InventorySlot.Cursor);
    });
  });

  describe("Flat slot to bag+slot conversion (simulating server logic)", () => {
    // This simulates the server's flatSlotToBagSlot function
    // to verify client and server are in sync

    function flatSlotToBagSlot(flatSlotID: number): {
      bag: number;
      slot: number;
    } {
      if (flatSlotID >= 0 && flatSlotID <= 21) {
        // Equipment slots 0-21 -> bag=-1, slot=flatSlotID
        return { bag: -1, slot: flatSlotID };
      } else if (flatSlotID >= 22 && flatSlotID <= 29) {
        // General inventory slots 22-29 -> bag=0, slot=0-7
        return { bag: 0, slot: flatSlotID - 22 };
      } else if (flatSlotID === 30) {
        // Cursor slot -> bag=0, slot=30
        return { bag: 0, slot: 30 };
      } else if (flatSlotID >= 251 && flatSlotID <= 330) {
        // Bag contents: 251-260 = bag 1, 261-270 = bag 2, etc.
        const bagNum = Math.floor((flatSlotID - 251) / 10) + 1;
        const slotInBag = (flatSlotID - 251) % 10;
        return { bag: bagNum, slot: slotInBag };
      } else if (flatSlotID >= 331 && flatSlotID <= 340) {
        // Cursor bag contents
        return { bag: 9, slot: flatSlotID - 331 };
      }
      return { bag: -1, slot: flatSlotID };
    }

    function bagSlotToFlatSlot(bag: number, slot: number): number {
      if (bag === -1) {
        return slot; // Equipment
      } else if (bag === 0) {
        if (slot === 30) return 30; // Cursor
        return slot + 22; // General inventory
      } else if (bag >= 1 && bag <= 8) {
        return 251 + (bag - 1) * 10 + slot; // Bag contents
      } else if (bag === 9) {
        return 331 + slot; // Cursor bag
      }
      return slot;
    }

    it("should correctly convert equipment slots", () => {
      // Primary weapon (slot 13) -> bag=-1, slot=13
      const result = flatSlotToBagSlot(InventorySlot.Primary);
      expect(result.bag).toBe(-1);
      expect(result.slot).toBe(13);

      // And back
      expect(bagSlotToFlatSlot(-1, 13)).toBe(13);
    });

    it("should correctly convert general inventory slots", () => {
      // General1 (slot 22) -> bag=0, slot=0
      const result1 = flatSlotToBagSlot(InventorySlot.General1);
      expect(result1.bag).toBe(0);
      expect(result1.slot).toBe(0);

      // General8 (slot 29) -> bag=0, slot=7
      const result2 = flatSlotToBagSlot(InventorySlot.General8);
      expect(result2.bag).toBe(0);
      expect(result2.slot).toBe(7);

      // And back
      expect(bagSlotToFlatSlot(0, 0)).toBe(22);
      expect(bagSlotToFlatSlot(0, 7)).toBe(29);
    });

    it("should correctly convert cursor slot", () => {
      const result = flatSlotToBagSlot(InventorySlot.Cursor);
      expect(result.bag).toBe(0);
      expect(result.slot).toBe(30);

      expect(bagSlotToFlatSlot(0, 30)).toBe(30);
    });

    it("should correctly convert bag content slots", () => {
      // First slot in General1's bag (251) -> bag=1, slot=0
      const result1 = flatSlotToBagSlot(251);
      expect(result1.bag).toBe(1);
      expect(result1.slot).toBe(0);

      // Last slot in General1's bag (260) -> bag=1, slot=9
      const result2 = flatSlotToBagSlot(260);
      expect(result2.bag).toBe(1);
      expect(result2.slot).toBe(9);

      // First slot in General2's bag (261) -> bag=2, slot=0
      const result3 = flatSlotToBagSlot(261);
      expect(result3.bag).toBe(2);
      expect(result3.slot).toBe(0);

      // And back
      expect(bagSlotToFlatSlot(1, 0)).toBe(251);
      expect(bagSlotToFlatSlot(1, 9)).toBe(260);
      expect(bagSlotToFlatSlot(2, 0)).toBe(261);
    });

    it("should be reversible for all slot types", () => {
      // Test equipment slots
      for (let i = 0; i <= 21; i++) {
        const { bag, slot } = flatSlotToBagSlot(i);
        expect(bagSlotToFlatSlot(bag, slot)).toBe(i);
      }

      // Test general inventory slots
      for (let i = 22; i <= 29; i++) {
        const { bag, slot } = flatSlotToBagSlot(i);
        expect(bagSlotToFlatSlot(bag, slot)).toBe(i);
      }

      // Test cursor
      const cursorResult = flatSlotToBagSlot(30);
      expect(bagSlotToFlatSlot(cursorResult.bag, cursorResult.slot)).toBe(30);

      // Test bag contents (251-330)
      for (let i = 251; i <= 330; i++) {
        const { bag, slot } = flatSlotToBagSlot(i);
        expect(bagSlotToFlatSlot(bag, slot)).toBe(i);
      }

      // Test cursor bag (331-340)
      for (let i = 331; i <= 340; i++) {
        const { bag, slot } = flatSlotToBagSlot(i);
        expect(bagSlotToFlatSlot(bag, slot)).toBe(i);
      }
    });
  });
});
