import React, { useState, useEffect, useCallback } from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import { Item } from "../entities/Item";

const isSellable = (item: Item): boolean => {
  return !!item.price && item.price > 0 && item.nodrop != 0 && item.norent != 0;
};

const SellGeneralInventory: React.FC = () => {
  const { characterProfile, removeInventoryItem } = usePlayerCharacterStore();
  const [autoSell, setAutoSell] = useState(true);
  const [deleteNoDrop, setDeleteNoDrop] = useState(true);

  const generalSlots = [23, 24, 25, 26, 27, 28, 29, 30];

  const sellGeneralInventory = useCallback(() => {
    let totalCopper = 0;

    characterProfile?.inventory?.forEach((item) => {
      if (generalSlots.includes(item.slotid) && item.itemDetails) {
        if (isSellable(item.itemDetails)) {
          totalCopper += Math.floor(item.itemDetails.price);
          removeInventoryItem(item.slotid);
        } else if (deleteNoDrop && item.itemDetails.nodrop == 0) {
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
      let newGold = (state.characterProfile.gold || 0) + gold;
      let newPlatinum = (state.characterProfile.platinum || 0) + platinum;

      // Convert existing copper to silver
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
  }, [characterProfile?.inventory, removeInventoryItem, deleteNoDrop]);

  useEffect(() => {
    if (autoSell) {
      const isInventoryFull = generalSlots.every((slot) =>
        characterProfile?.inventory?.some((item) => item.slotid === slot)
      );

      if (isInventoryFull) {
        sellGeneralInventory();
      }
    }
  }, [characterProfile?.inventory, autoSell, sellGeneralInventory]);

  return (
    <div>
      <button onClick={sellGeneralInventory}>Sell General Inventory</button>
      <label>
        <input
          type="checkbox"
          checked={autoSell}
          onChange={(e) => setAutoSell(e.target.checked)}
        />
        Auto sell when full
      </label>
      <label>
        <input
          type="checkbox"
          checked={deleteNoDrop}
          onChange={(e) => setDeleteNoDrop(e.target.checked)}
        />
        Delete NoDrop Items
      </label>
    </div>
  );
};

export default SellGeneralInventory;
