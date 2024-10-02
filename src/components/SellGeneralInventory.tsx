import React, { useState, useEffect } from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import { InventorySlot } from "../entities/InventorySlot";

const SellGeneralInventory: React.FC = () => {
  const { characterProfile, removeInventoryItem } = usePlayerCharacterStore();
  const [autoSell, setAutoSell] = useState(true);

  const sellGeneralInventory = () => {
    const generalSlots = [23, 24, 25, 26, 27, 28, 29, 30];
    let totalValue = 0;

    characterProfile?.inventory?.forEach((item) => {
      if (generalSlots.includes(item.slotid) && item.itemDetails?.price && item.itemDetails.price > 0) {
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
  };

  useEffect(() => {
    if (autoSell) {
      const generalSlots = [23, 24, 25, 26, 27, 28, 29, 30];
      const isInventoryFull = generalSlots.every(slot => 
        characterProfile?.inventory?.some(item => item.slotid === slot)
      );

      if (isInventoryFull) {
        sellGeneralInventory();
      }
    }
  }, [characterProfile?.inventory, autoSell]);

  return (
    <div>
      <button onClick={sellGeneralInventory}>
        Sell General Inventory
      </button>
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
