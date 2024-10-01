import React from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import styles from "./EquippedItemsInventory.module.css";
import playerInventoryBackground from "/images/ui/playerinventorybackground.png";
import { InventorySlot } from "../entities/InventorySlot";
import { handleItemClick } from "../utils/itemUtils";

const EquippedItemsInventory: React.FC = () => {
  const { characterProfile, setHoveredItem } = usePlayerCharacterStore();

  const equippedSlots = [
    [InventorySlot.Ear1, InventorySlot.Neck, InventorySlot.Face, InventorySlot.Head, InventorySlot.Ear2],
    [InventorySlot.Finger1, InventorySlot.Wrist1, InventorySlot.Arms, InventorySlot.Hands, InventorySlot.Wrist2, InventorySlot.Finger2],
    [InventorySlot.Shoulders, InventorySlot.Chest, InventorySlot.Back, InventorySlot.Waist, InventorySlot.Legs, InventorySlot.Feet],
    [InventorySlot.Primary, InventorySlot.Secondary, InventorySlot.Range, InventorySlot.Ammo]
  ];

  const getInventoryItemForSlot = (slotId: InventorySlot) => {
    return characterProfile?.inventory?.find((item) => item.slotid === slotId);
  };

  return (
    <div className={styles.equippedItemsContainer}>
      <div className={styles.equippedItems} style={{ backgroundImage: `url(${playerInventoryBackground})` }}>
        {equippedSlots.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {row.map((slot) => {
              const inventoryItem = getInventoryItemForSlot(slot);
              const itemDetails = inventoryItem?.itemDetails;
              
              return (
                <div 
                  key={slot} 
                  className={styles.slot}
                  onMouseEnter={() => setHoveredItem(itemDetails || null)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleItemClick(slot)}
                >
                  {itemDetails && (
                    <img
                      src={`/icons/${itemDetails.icon}.gif`}
                      alt={itemDetails.Name}
                      title={itemDetails.Name}
                      className={styles.itemIcon}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EquippedItemsInventory;