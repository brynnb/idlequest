import React, { useState } from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { getNextAvailableSlot } from "@utils/inventoryUtils";
import { InventoryItem } from "@entities/InventoryItem";

const generalSlots = [23, 24, 25, 26, 27, 28, 29, 30]; // Define your general slots here

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
      const nextSlot = getNextAvailableSlot(
        characterProfile.inventory,
        generalSlots
      );

      if (nextSlot === null) {
        alert("No available slots in inventory!");
        return;
      }

      const newItem: InventoryItem = {
        itemid: parseInt(itemId),
        slotid: nextSlot,
        charges: 1,
        color: 0,
        augslot1: 0,
        augslot2: 0,
        augslot3: 0,
        augslot4: 0,
        augslot5: 0,
        augslot6: 0,
        instnodrop: 0,
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
