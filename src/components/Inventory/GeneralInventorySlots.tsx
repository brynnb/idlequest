import React, { useState } from "react";
import styled from "styled-components";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import generalInventoryBackground from "/images/ui/generalinventoryslots.png";
import { useInventoryActions } from "@hooks/useInventoryActions";
import { InventorySlot } from "@entities/InventorySlot";
import ContainerInventoryModal from "./ContainerInventoryModal";
import { ItemClass } from "@entities/ItemClass";

const GeneralInventoryContainer = styled.div``;

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
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const GeneralInventorySlots: React.FC = () => {
  const { characterProfile, setHoveredItem } = usePlayerCharacterStore();
  const { handleItemClick } = useInventoryActions();
  const [openBagSlots, setOpenBagSlots] = useState<Set<number>>(new Set());

  // General inventory slots 22-29 (matches server slot IDs)
  const generalSlots = [
    InventorySlot.General1, // 22
    InventorySlot.General2, // 23
    InventorySlot.General3, // 24
    InventorySlot.General4, // 25
    InventorySlot.General5, // 26
    InventorySlot.General6, // 27
    InventorySlot.General7, // 28
    InventorySlot.General8, // 29
  ];

  const getInventoryItemForSlot = (slotId: number) => {
    return characterProfile?.inventory?.find((item) => item.slotid === slotId);
  };

  const cursorItem = getInventoryItemForSlot(InventorySlot.Cursor);

  const handleBagClick = (slot: number) => {
    setOpenBagSlots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(slot)) {
        newSet.delete(slot);
      } else {
        newSet.add(slot);
      }
      return newSet;
    });
  };

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
              onClick={() => handleItemClick(slot as InventorySlot)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (itemDetails?.itemclass === ItemClass.CONTAINER) {
                  handleBagClick(slot);
                }
              }}
            >
              {itemDetails && (
                <ItemIcon
                  src={`/icons/${itemDetails.icon}.gif`}
                  alt={itemDetails.name}
                  title={itemDetails.name}
                />
              )}
            </Slot>
          );
        })}
      </GeneralInventory>
      {Array.from(openBagSlots).map((slot) => (
        <ContainerInventoryModal
          key={`container-modal-${slot}`}
          bagSlot={slot}
          onClose={() => handleBagClick(slot)}
        />
      ))}
    </GeneralInventoryContainer>
  );
};

export default GeneralInventorySlots;
