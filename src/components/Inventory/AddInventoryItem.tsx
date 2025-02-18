import React, { useState } from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { getNextAvailableSlot } from "@utils/inventoryUtils";
import { InventoryItem } from "@entities/InventoryItem";
import { getItemById } from "@utils/databaseOperations";

const AddInventoryItem: React.FC = () => {
  const [itemId, setItemId] = useState("");
  const { addInventoryItem, characterProfile } = usePlayerCharacterStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,6}$/.test(value)) {
      setItemId(value);
    }
  };

  const handleAddItem = async () => {
    if (itemId) {
      const itemDetails = await getItemById(parseInt(itemId));
      if (!itemDetails) {
        console.error(`Failed to fetch item details for item ID: ${itemId}`);
        return;
      }

      const newItem: InventoryItem = {
        itemid: parseInt(itemId),
        charges: itemDetails.maxcharges || 0,
        color: 0,
        augslot1: 0,
        augslot2: 0,
        augslot3: 0,
        augslot4: 0,
        augslot5: 0,
        augslot6: 0,
        instnodrop: 0,
        itemDetails,
      };

      await addInventoryItem(newItem);
      setItemId(""); // Clear the input after adding
    }
  };

  return (
    <div>
      <input
        type="text"
        value={itemId}
        onChange={handleInputChange}
        placeholder="Enter Item ID (max 6 digits)"
        maxLength={6}
      />
      <button onClick={handleAddItem} disabled={!itemId}>
        Add Item to Inventory
      </button>
    </div>
  );
};

export default AddInventoryItem;
