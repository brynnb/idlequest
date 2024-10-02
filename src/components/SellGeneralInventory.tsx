import React, { useState, useEffect, useCallback } from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import { InventorySlot } from "../entities/InventorySlot";
import { Item } from "../entities/Item";

const isSellable = (item: Item): boolean => {
  console.log(
    `Item "${item.name}" - ${item.nodrop != 0 ? " Drop" : "No Drop"}`
  );
  return !!item.price && item.price > 0 && item.nodrop != 0 && item.norent != 0;
};

const SellGeneralInventory: React.FC = () => {
  const { characterProfile, removeInventoryItem } = usePlayerCharacterStore();
  const [autoSell, setAutoSell] = useState(true);

  const generalSlots = [23, 24, 25, 26, 27, 28, 29, 30];

  const sellGeneralInventory = useCallback(() => {
    let totalValue = 0;

    characterProfile?.inventory?.forEach((item) => {
      if (
        generalSlots.includes(item.slotid) &&
        item.itemDetails &&
        isSellable(item.itemDetails)
      ) {
        totalValue += Math.floor(item.itemDetails.price);
        removeInventoryItem(item.slotid);
      }
    });

    const platinum = Math.floor(totalValue / 1000);
    const gold = Math.floor((totalValue % 1000) / 100);
    const silver = Math.floor((totalValue % 100) / 10);
    const copper = totalValue % 10;

    usePlayerCharacterStore.setState((state) => ({
      characterProfile: {
        ...state.characterProfile,
        platinum: (state.characterProfile.platinum || 0) + platinum,
        gold: (state.characterProfile.gold || 0) + gold,
        silver: (state.characterProfile.silver || 0) + silver,
        copper: (state.characterProfile.copper || 0) + copper,
      },
    }));

    console.log(`Sold items for ${platinum}p ${gold}g ${silver}s ${copper}c`);
  }, [characterProfile?.inventory, removeInventoryItem]);

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
    </div>
  );
};

export default SellGeneralInventory;
