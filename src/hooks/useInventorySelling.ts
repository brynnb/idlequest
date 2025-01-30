import { useCallback } from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { Item } from "@entities/Item";
import { getBagStartingSlot } from "@utils/itemUtils";
import { sellGeneralInventory as sellGeneralInventoryUtil } from "@utils/inventoryUtils";

const GENERAL_SLOTS = [23, 24, 25, 26, 27, 28, 29, 30];

export const useInventorySelling = () => {
  const sellGeneralInventory = useCallback((deleteNoDrop: boolean) => {
    return sellGeneralInventoryUtil(deleteNoDrop);
  }, []);

  const isGeneralInventoryFull = useCallback(() => {
    const { characterProfile } = usePlayerCharacterStore.getState();
    return GENERAL_SLOTS.every((slot) =>
      characterProfile?.inventory?.some((item) => item.slotid === slot)
    );
  }, []);

  return { sellGeneralInventory, isGeneralInventoryFull };
};
