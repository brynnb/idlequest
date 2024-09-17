import { useCallback, useMemo } from 'react';
import { useDatabase } from './useDatabase';
import usePlayerCharacterStore from '../stores/PlayerCharacterStore';
import { InventoryItem } from '../entities/InventoryItem';
import { Item } from '../entities/Item';

export const useInventoryManager = () => {
  const { getById } = useDatabase<"items">();
  const { characterProfile, setInventory } = usePlayerCharacterStore();

  const getItemDetails = useCallback(async (itemId: number): Promise<Item | undefined> => {
    return await getById("items", itemId);
  }, [getById]);

  const updateItemDetails = useCallback(async () => {
    const updatedInventory = await Promise.all(
      characterProfile.inventory.map(async (item) => {
        if (item.itemDetails) return item; // Skip if item details already exist
        const itemDetails = await getItemDetails(item.itemid);
        return { ...item, itemDetails };
      })
    );
    setInventory(updatedInventory);
  }, [characterProfile.inventory, getItemDetails, setInventory]);

  const addItemToInventory = useCallback(async (newItem: InventoryItem) => {
    const itemDetails = await getItemDetails(newItem.itemid);
    const updatedInventory = [...characterProfile.inventory, { ...newItem, itemDetails }];
    setInventory(updatedInventory);
  }, [characterProfile.inventory, getItemDetails, setInventory]);

  const inventoryWithDetails = useMemo(() => characterProfile.inventory, [characterProfile.inventory]);

  return {
    inventory: inventoryWithDetails,
    updateItemDetails,
    addItemToInventory,
  };
};