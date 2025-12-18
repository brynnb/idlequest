// Slot IDs match server/internal/constants/items.go exactly
export enum InventorySlot {
  // Equipment slots (0-21)
  Charm = 0,
  Ear1 = 1,
  Head = 2,
  Face = 3,
  Ear2 = 4,
  Neck = 5,
  Shoulders = 6,
  Arms = 7,
  Back = 8,
  Wrist1 = 9,
  Wrist2 = 10,
  Range = 11,
  Hands = 12,
  Primary = 13,
  Secondary = 14,
  Finger1 = 15,
  Finger2 = 16,
  Chest = 17,
  Legs = 18,
  Feet = 19,
  Waist = 20,
  Ammo = 21,
  // General inventory slots (22-29)
  General1 = 22,
  General2 = 23,
  General3 = 24,
  General4 = 25,
  General5 = 26,
  General6 = 27,
  General7 = 28,
  General8 = 29,
  // Cursor slot (30)
  Cursor = 30,
  // Bag content starting slots (bags in general slots 22-29)
  General1BagStartingSlot = 251,
  General2BagStartingSlot = 261,
  General3BagStartingSlot = 271,
  General4BagStartingSlot = 281,
  General5BagStartingSlot = 291,
  General6BagStartingSlot = 301,
  General7BagStartingSlot = 311,
  General8BagStartingSlot = 321,
  CursorBagStartingSlot = 331,
}

// Bitmasks for equipment slots only (used for item slot restrictions)
// These match the server's slot bitmask values
export const SlotBitmasks: Partial<Record<InventorySlot, number>> = {
  [InventorySlot.Charm]: 1,
  [InventorySlot.Ear1]: 2,
  [InventorySlot.Head]: 4,
  [InventorySlot.Face]: 8,
  [InventorySlot.Ear2]: 16,
  [InventorySlot.Neck]: 32,
  [InventorySlot.Shoulders]: 64,
  [InventorySlot.Arms]: 128,
  [InventorySlot.Back]: 256,
  [InventorySlot.Wrist1]: 512,
  [InventorySlot.Wrist2]: 1024,
  [InventorySlot.Range]: 2048,
  [InventorySlot.Hands]: 4096,
  [InventorySlot.Primary]: 8192,
  [InventorySlot.Secondary]: 16384,
  [InventorySlot.Finger1]: 32768,
  [InventorySlot.Finger2]: 65536,
  [InventorySlot.Chest]: 131072,
  [InventorySlot.Legs]: 262144,
  [InventorySlot.Feet]: 524288,
  [InventorySlot.Waist]: 1048576,
  [InventorySlot.Ammo]: 2097152,
};

export function getInventorySlotNames(slotBitmask: number): string[] {
  const slotNames: string[] = [];

  // Check the bitmask
  for (const [key, value] of Object.entries(SlotBitmasks)) {
    if ((slotBitmask & value) !== 0) {
      slotNames.push(
        InventorySlot[Number(key)].replace(/\d+/g, "").toUpperCase()
      );
    }
  }

  return slotNames;
}
