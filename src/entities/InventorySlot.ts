export enum InventorySlot {
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
  PowerSource = 21,
  Ammo = 22,
  Cursor = 31,
  General1Bag = 262,
  General2Bag = 272,
  General3Bag = 282,
  General4Bag = 292,
  General5Bag = 302,
  General6Bag = 312,
  General7Bag = 322,
  General8Bag = 332,
  CursorBag = 342,
}

export const SlotBitmasks: { [key in InventorySlot]: number } = {
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
  [InventorySlot.PowerSource]: 2097152,
  [InventorySlot.Ammo]: 4194304,
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
