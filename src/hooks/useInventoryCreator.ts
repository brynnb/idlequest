import { useCallback, useState } from "react";
import startingItemsData from "@data/json/starting_items.json";
import { eqDataService, type Item } from "@utils/eqDataService";

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
          (item.race === Number(race) || item.race === 0) &&
          (item.class === Number(characterClass) || item.class === 0) &&
          (item.deityid === Number(deity) || item.deityid === 0) &&
          (item.zoneid === Number(zone) || item.zoneid === 0)
      );

      const inventoryItems = await Promise.all(
        matchingStartingItems.slice(0, 8).map(async (startingItem) => {
          const item = await eqDataService.getItemById(startingItem.itemid);
          if (item) {
            item.charges = startingItem.item_charges || 0;
          }
          return item;
        })
      );

      setLoading(false);
      return inventoryItems.filter(
        (item): item is Item => item !== null && item !== undefined
      );
    },
    []
  );

  return { createInventory, loading };
};

export default useInventoryCreator;
