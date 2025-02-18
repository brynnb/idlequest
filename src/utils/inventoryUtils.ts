import { InventoryItem } from "@entities/InventoryItem";
import { InventorySlot } from "@entities/InventorySlot";
import CharacterProfile from "@entities/CharacterProfile";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { Item } from "@entities/Item";
import useChatStore, { MessageType } from "@stores/ChatStore";

const GENERAL_SLOTS = [23, 24, 25, 26, 27, 28, 29, 30];

export const getBagStartingSlot = (baseSlot: number): number => {
  const slotMap = {
    23: 262,
    24: 272,
    25: 282,
    26: 292,
    27: 302,
    28: 312,
    29: 322,
    30: 332,
    31: 342,
  };
  return slotMap[baseSlot as keyof typeof slotMap] ?? -1;
};

export const getNextAvailableSlot = (
  inventory: InventoryItem[]
): number | null => {
  // Remove any duplicate slots first
  const deduplicatedInventory = inventory.reduce((acc, item) => {
    const existingItem = acc.find((i) => i.slotid === item.slotid);
    if (!existingItem) {
      acc.push(item);
    }
    return acc;
  }, [] as InventoryItem[]);

  const occupiedSlots = new Set(
    deduplicatedInventory.map((item) => item.slotid)
  );

  // First check general slots
  for (const slot of GENERAL_SLOTS) {
    if (!occupiedSlots.has(slot)) {
      return slot;
    }
  }

  // Then check bag slots, but only for bags that exist
  for (const baseSlot of GENERAL_SLOTS) {
    const bagItem = deduplicatedInventory.find(
      (item) => item.slotid === baseSlot && item.itemDetails?.itemclass === 1
    );

    if (bagItem?.itemDetails?.bagslots) {
      const bagSize = bagItem.itemDetails.bagslots;
      const startingSlot = getBagStartingSlot(baseSlot);

      if (startingSlot > 0) {
        for (let i = 0; i < bagSize; i++) {
          const bagSlot = startingSlot + i;
          if (!occupiedSlots.has(bagSlot)) {
            return bagSlot;
          }
        }
      }
    }
  }

  return null;
};

export const calculateTotalEquippedAC = (
  character: CharacterProfile
): number => {
  if (!character.inventory) return 0;

  return character.inventory.reduce((totalAC, item) => {
    if (
      item.slotid !== undefined &&
      item.slotid >= InventorySlot.Charm &&
      item.slotid <= InventorySlot.Ammo
    ) {
      const itemAC = Number(item.itemDetails?.ac) || 0;
      return totalAC + itemAC;
    }
    return totalAC;
  }, 0);
};

export const calculateTotalWeight = (character: CharacterProfile): number => {
  if (!character.inventory) return 0;

  const total = character.inventory.reduce((totalWeight, item) => {
    const itemWeight = Number(item.itemDetails?.weight) || 0;

    return totalWeight + itemWeight;
  }, 0);
  return Math.round(total / 10);
};

export const sellGeneralInventory = (deleteNoDrop: boolean = false) => {
  const { characterProfile, removeInventoryItem } =
    usePlayerCharacterStore.getState();
  const { addMessage } = useChatStore.getState();
  let totalCopper = 0;
  let itemsSold = 0;

  characterProfile?.inventory?.forEach((item) => {
    if (
      item.slotid !== undefined &&
      item.slotid >= 23 && // Only sell items in general inventory and bags
      item.itemDetails
    ) {
      if (item.itemDetails.itemclass == 1) {
        // For bags, check their contents but don't sell the bag itself
        const bagStartSlot = getBagStartingSlot(item.slotid);
        const bagSize = item.itemDetails.bagslots || 0;

        for (let i = 0; i < bagSize; i++) {
          const bagSlot = bagStartSlot + i;
          const bagItem = characterProfile.inventory?.find(
            (i) => i.slotid === bagSlot
          );

          if (bagItem?.itemDetails) {
            if (isSellable(bagItem.itemDetails)) {
              totalCopper += Math.floor(bagItem.itemDetails.price || 0);
              console.log(
                `Selling ${bagItem.itemDetails.name} for ${
                  bagItem.itemDetails.price || 0
                } copper`
              );
              removeInventoryItem(bagSlot);
              itemsSold++;
            } else if (deleteNoDrop && bagItem.itemDetails.nodrop === 0) {
              console.log(`Deleting NO DROP item: ${bagItem.itemDetails.name}`);
              removeInventoryItem(bagSlot);
            }
          }
        }
      } else if (isSellable(item.itemDetails)) {
        totalCopper += Math.floor(item.itemDetails.price || 0);
        console.log(
          `Selling ${item.itemDetails.name} for ${
            item.itemDetails.price || 0
          } copper`
        );
        removeInventoryItem(item.slotid);
        itemsSold++;
      } else if (deleteNoDrop && item.itemDetails.nodrop === 0) {
        console.log(`Deleting NO DROP item: ${item.itemDetails.name}`);
        removeInventoryItem(item.slotid);
      }
    }
  });

  const platinum = Math.floor(totalCopper / 1000);
  const gold = Math.floor((totalCopper % 1000) / 100);
  const silver = Math.floor((totalCopper % 100) / 10);
  const copper = totalCopper % 10;

  usePlayerCharacterStore.setState((state) => {
    let newCopper = (state.characterProfile.copper || 0) + copper;
    let newSilver = (state.characterProfile.silver || 0) + silver;
    const newGold = (state.characterProfile.gold || 0) + gold;
    const newPlatinum = (state.characterProfile.platinum || 0) + platinum;

    newSilver += Math.floor(newCopper / 10);
    newCopper = newCopper % 10;

    return {
      characterProfile: {
        ...state.characterProfile,
        platinum: newPlatinum,
        gold: newGold,
        silver: newSilver,
        copper: newCopper,
      },
    };
  });

  console.log(
    `Sold ${itemsSold} items for a total of ${platinum}p ${gold}g ${silver}s ${copper}c`
  );

  if (itemsSold > 0) {
    addMessage(
      `You have sold ${itemsSold} item${
        itemsSold > 1 ? "s" : ""
      } for ${platinum}p ${gold}g ${silver}s ${copper}c.`,
      MessageType.LOOT
    );
  }

  return { platinum, gold, silver, copper };
};

const isSellable = (item: Item): boolean => {
  return item.itemclass != 1 && item.nodrop != 0 && item.norent != 0;
};
