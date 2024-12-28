import { useCallback } from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { Item } from "@entities/Item";
import { getBagStartingSlot } from "@utils/itemUtils";

const GENERAL_SLOTS = [23, 24, 25, 26, 27, 28, 29, 30];

export const useInventorySelling = () => {
  const { characterProfile, removeInventoryItem } = usePlayerCharacterStore();

  const isSellable = (item: Item): boolean => {
    console.log(item);
    console.log(item.itemclass);
    return item.itemclass != 1 && item.nodrop != 0 && item.norent != 0;
  };

  const sellGeneralInventory = useCallback(
    (deleteNoDrop: boolean) => {
      console.log("Selling general inventory");
      let totalCopper = 0;

      characterProfile?.inventory?.forEach((item) => {
        if (!item.slotid) return;
        if (GENERAL_SLOTS.includes(item.slotid) && item.itemDetails) {
          if (item.itemDetails.itemclass == 1) {
            // For bags, check their contents
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
                  if (bagSlot !== undefined) {
                    removeInventoryItem(bagSlot);
                  }
                } else if (deleteNoDrop && bagItem.itemDetails.nodrop === 0) {
                  if (bagSlot !== undefined) {
                    removeInventoryItem(bagSlot);
                  }
                }
              }
            }
          } else if (isSellable(item.itemDetails)) {
            totalCopper += Math.floor(item.itemDetails.price || 0);
            if (item.slotid !== undefined) {
              removeInventoryItem(item.slotid);
            }
          } else if (deleteNoDrop && item.itemDetails.nodrop === 0) {
            if (item.slotid !== undefined) {
              removeInventoryItem(item.slotid);
            }
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

      console.log(`Sold items for ${platinum}p ${gold}g ${silver}s ${copper}c`);
    },
    [characterProfile?.inventory, removeInventoryItem]
  );

  const isGeneralInventoryFull = useCallback(() => {
    return GENERAL_SLOTS.every((slot) =>
      characterProfile?.inventory?.some((item) => item.slotid === slot)
    );
  }, [characterProfile?.inventory]);

  return { sellGeneralInventory, isGeneralInventoryFull };
};
