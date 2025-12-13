import { useCallback } from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { sellGeneralInventory as sellGeneralInventoryUtil } from "@utils/inventoryUtils";

// General inventory slots match server: 22-29
const GENERAL_SLOTS = [22, 23, 24, 25, 26, 27, 28, 29];

export const useInventorySelling = () => {
  const sellGeneralInventory = useCallback((deleteNoDrop: boolean) => {
    return sellGeneralInventoryUtil(deleteNoDrop);
  }, []);

  const isGeneralInventoryFull = useCallback(() => {
    const { characterProfile } = usePlayerCharacterStore.getState();
    return GENERAL_SLOTS.every((slot) =>
      characterProfile?.inventory?.some(
        (item) => item.bag === 0 && item.slot === slot
      )
    );
  }, []);

  return { sellGeneralInventory, isGeneralInventoryFull };
};
