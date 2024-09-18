import React, { useState } from "react";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";
import styles from "./GeneralInventorySlots.module.css";
import generalInventoryBackground from "/images/ui/generalinventoryslots.png";
import ItemInformationDisplay from "./ItemInformationDisplay";
import { Item } from "../entities/Item";

const GeneralInventorySlots: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);

  const generalSlots = [23, 24, 25, 26, 27, 28, 29, 30];

  const getInventoryItemForSlot = (slotId: number) => {
    return characterProfile?.inventory?.find((item) => item.slotid === slotId);
  };

  return (
    <div className={styles.generalInventoryContainer}>
      <div className={styles.generalInventory} style={{ backgroundImage: `url(${generalInventoryBackground})` }}>
        {generalSlots.map((slot, index) => {
          const inventoryItem = getInventoryItemForSlot(slot);
          const itemDetails = inventoryItem?.itemDetails;
          
          const row = Math.floor(index / 2);
          const col = index % 2;
          
          return (
            <div 
              key={slot} 
              className={styles.slot}
              style={{
                position: 'absolute',
                left: `${col * 50}%`,
                top: `${row * 25}%`,
                width: '50%',
                height: '25%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onMouseEnter={() => setHoveredItem(itemDetails || null)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {itemDetails ? (
                <img
                  src={`/icons/${itemDetails.icon}.gif`}
                  alt={itemDetails.Name}
                  title={itemDetails.Name}
                  className={styles.itemIcon}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <ItemInformationDisplay 
        item={hoveredItem} 
        isVisible={hoveredItem !== null}
      />
    </div>
  );
};

export default GeneralInventorySlots;
