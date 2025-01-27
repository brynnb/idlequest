import { useCallback, useState } from "react";
import startingItemsData from "../../data/starting_items.json";
import { Item } from "@entities/Item";
import { getItemById } from "@utils/databaseOperations";
import { InventoryItem } from "@entities/InventoryItem";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { findFirstAvailableGeneralSlot } from "@utils/itemUtils";

const useInventoryCreator = () => {
  const [loading, setLoading] = useState(false);

  const createInventory = useCallback(
    async (
      race: number,
      characterClass: number,
      deity: number,
      zone: number
    ) => {
      setLoading(true);

      const matchingStartingItems = startingItemsData.filter(
        (item) =>
          (item.race === race || item.race === 0) &&
          (item.class === characterClass || item.class === 0) &&
          (item.deityid === deity || item.deityid === 0) &&
          (item.zoneid === zone || item.zoneid === 0)
      );

      const { characterProfile } = usePlayerCharacterStore.getState();
      let updatedInventory = [...(characterProfile?.inventory || [])];
      const items: Item[] = [];

      for (const startingItem of matchingStartingItems.slice(0, 8)) {
        const item = await getItemById(startingItem.itemid);
        if (item) {
          const slot = findFirstAvailableGeneralSlot(updatedInventory);
          if (slot !== undefined) {
            const newItem: InventoryItem = {
              itemid: item.id,
              slotid: slot,
              charges: startingItem.item_charges || 0,
              itemDetails: item,
            };
            updatedInventory.push(newItem);
            items.push(item);
          }
        }
      }

      setLoading(false);
      return items;
    },
    []
  );

  return { createInventory, loading };
};

export default useInventoryCreator;
