import { useCallback, useState } from "react";
import startingItemsData from "../../data/starting_items.json";
import { InventoryItem } from "../entities/InventoryItem";
import { useDatabase } from "./useDatabase";

const useInventoryCreator = () => {
  const { getById } = useDatabase<"items">();
  const [loading, setLoading] = useState(false);

  const createInventory = useCallback(async (race: string, characterClass: string, deity: string, zone: string) => {
    setLoading(true);

    const matchingStartingItems = startingItemsData.filter(
      (item) =>
        (item.race === race || item.race === 0) &&
        (item.class === characterClass || item.class === 0) &&
        (item.deityid === deity || item.deityid === 0) &&
        (item.zoneid === zone || item.zoneid === 0)
    );

    const inventoryItems = await Promise.all(
      matchingStartingItems.map(async (startingItem) => {
        const item = await getById("items", startingItem.itemid);
        if (item) {
          return {
            ...item,
            slotid: startingItem.slot || -1,
            charges: startingItem.item_charges || 0,
          };
        } else {
          return null;
        }
      })
    );

    const filteredInventory = inventoryItems.filter(
      (item): item is InventoryItem => item !== null
    );

    setLoading(false);
    return filteredInventory;
  }, [getById]);

  return { createInventory, loading };
};

export default useInventoryCreator;
