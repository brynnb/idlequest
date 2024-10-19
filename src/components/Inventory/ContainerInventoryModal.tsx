import React, { useState } from "react";
import styled from "styled-components";
import Draggable from "react-draggable";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { handleItemClick } from "@utils/itemUtils";


const ModalContainer = styled.div`
  width: 219px;
  background-color: #2c2c2c;
  border: 2px solid #gold;
  border-radius: 5px;
  padding: 10px;
  position: absolute;
  z-index: 1000;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  cursor: move;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #gold;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #gold;
  font-size: 18px;
  cursor: pointer;
`;

const ContainerInventory = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
`;

const Slot = styled.div`
  width: 80px;
  height: 80px;
  background-color: #3c3c3c;
  border: 1px solid #gold;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ItemIcon = styled.img`
  width: 64px;
  height: 64px;
  object-fit: contain;
`;

const DoneButton = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #gold;
  color: #2c2c2c;
  border: none;
  border-radius: 3px;
  margin-top: 10px;
  cursor: pointer;
`;

interface ContainerInventoryModalProps {
  bagSlot: number;
  onClose: () => void;
}

const ContainerInventoryModal: React.FC<ContainerInventoryModalProps> = ({ bagSlot, onClose }) => {
  const { characterProfile, setHoveredItem } = usePlayerCharacterStore();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const bagItem = characterProfile?.inventory?.find((item) => item.slotid === bagSlot);
  if (!bagItem || !bagItem.itemDetails) return null;

  const containerSlots = bagItem.itemDetails.bagslots || 0;
  const containerItems = characterProfile?.inventory?.filter(
    (item) => item.slotid >= 251 && item.slotid < 251 + containerSlots
  );

  const handleDrag = (e: any, data: { x: number; y: number }) => {
    setPosition({ x: data.x, y: data.y });
  };

  return (
    <Draggable handle=".handle" position={position} onDrag={handleDrag}>
      <ModalContainer>
        <ModalHeader className="handle">
          <ModalTitle>{bagItem.itemDetails.Name}</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ContainerInventory>
          {Array.from({ length: containerSlots }).map((_, index) => {
            const slotId = 251 + index;
            const inventoryItem = containerItems?.find((item) => item.slotid === slotId);
            const itemDetails = inventoryItem?.itemDetails;

            return (
              <Slot
                key={`container-slot-${slotId}`}
                onMouseEnter={() => setHoveredItem(itemDetails || null)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleItemClick(slotId)}
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
        </ContainerInventory>
        <DoneButton onClick={onClose}>Done</DoneButton>
      </ModalContainer>
    </Draggable>
  );
};

export default ContainerInventoryModal;

