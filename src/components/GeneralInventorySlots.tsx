import React from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import styles from "./GeneralInventorySlots.module.css";

const GeneralInventorySlots: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();

  const generalSlots = [23, 24, 25, 26, 27, 28, 29, 30];

  const getInventoryItemForSlot = (slotId: number) => {
    return characterProfile?.inventory?.find((item) => item.slotid === slotId);
  };

  return (
    <div className={styles.generalInventory}>
      {generalSlots.map((slot) => {
        const inventoryItem = getInventoryItemForSlot(slot);
        const itemDetails = inventoryItem?.itemDetails;
        
        return (
          <div key={slot} className={styles.slot}>
            {itemDetails ? (
              <img
                src={`/icons/${itemDetails.icon}.gif`}
                alt={itemDetails.name}
                title={itemDetails.name}
                className={styles.itemIcon}
              />
            ) : (
              <div className={styles.emptySlot} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GeneralInventorySlots;
