import { useCallback, useState } from "react";
import startingItemsData from "../../data/starting_items.json";
import { InventoryItem } from "@entities/InventoryItem";

const useInventoryCreator = () => {
  const [loading, setLoading] = useState(false);

  const createInventory = useCallback(
    async (
      race: string,
      characterClass: string,
      deity: string,
      zone: string
    ) => {
      setLoading(true);

      const matchingStartingItems = startingItemsData.filter(
        (item) =>
          (item.race === race || item.race === 0) &&
          (item.class === characterClass || item.class === 0) &&
          (item.deityid === deity || item.deityid === 0) &&
          (item.zoneid === zone || item.zoneid === 0)
      );

      let currentSlot = 23; //todo: make this use getNextAvailableSlot function from that other file
      const inventoryItems: InventoryItem[] = matchingStartingItems
        .slice(0, 8)
        .map((startingItem) => {
          if (currentSlot > 30) return null;

          const inventoryItem: InventoryItem = {
            slotid: currentSlot,
            itemid: startingItem.itemid,
            charges: startingItem.item_charges || 0,
          };
          currentSlot++;
          return inventoryItem;
        })
        .filter((item): item is InventoryItem => item !== null);

      setLoading(false);
      return inventoryItems;
    },
    []
  );

  return { createInventory, loading };
};

export default useInventoryCreator;
