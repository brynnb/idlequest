import React from "react";
import styled from "styled-components";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import generalInventoryBackground from "/images/ui/generalinventoryslots.png";
import { handleItemClick } from "@utils/itemUtils";
import { InventorySlot } from "@entities/InventorySlot";

const GeneralInventoryContainer = styled.div`
  /* Add any container styles here */
`;

const GeneralInventory = styled.div`
  width: 219px;
  height: 439px;
  background-size: 100% 100%;
  position: relative;
  background-image: url(${generalInventoryBackground});
  position: absolute;
  right: 25px;
  top: 570px;
`;

const Slot = styled.div<{ $row: number; $col: number }>`
  position: absolute;
  left: ${(props) => props.$col * 50}%;
  top: ${(props) => props.$row * 25}%;
  width: 50%;
  height: 25%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
`;

const ItemIcon = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
`;

const GeneralInventorySlots: React.FC = () => {
  const { characterProfile, setHoveredItem } = usePlayerCharacterStore();

  const generalSlots = [23, 24, 25, 26, 27, 28, 29, 30];

  const getInventoryItemForSlot = (slotId: number) => {
    return characterProfile?.inventory?.find((item) => item.slotid === slotId);
  };

  const cursorItem = getInventoryItemForSlot(InventorySlot.Cursor);

  return (
    <GeneralInventoryContainer>
      <GeneralInventory>
        {generalSlots.map((slot, index) => {
          const inventoryItem = getInventoryItemForSlot(slot);
          const itemDetails = inventoryItem?.itemDetails;

          const row = Math.floor(index / 2);
          const col = index % 2;

          return (
            <Slot
              key={`general-slot-${slot}`}
              $row={row}
              $col={col}
              onMouseEnter={() => setHoveredItem(itemDetails || null)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleItemClick(slot)}
            >
              {itemDetails && (
                <ItemIcon
                  src={`/icons/${itemDetails.icon}.gif`}
                  alt={itemDetails.Name}
                  title={itemDetails.Name}
                />
              )}
            </Slot>
          );
        })}
      </GeneralInventory>
    </GeneralInventoryContainer>
  );
};

export default GeneralInventorySlots;
