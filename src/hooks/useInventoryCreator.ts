import { useCallback, useState } from "react";
import startingItemsData from "@data/json/starting_items.json";
import { Item } from "@entities/Item";
import { eqDataService } from "@utils/eqDataService";

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
      return inventoryItems.filter((item): item is Item => item !== null);
    },
    []
  );

  return { createInventory, loading };
};

export default useInventoryCreator;
