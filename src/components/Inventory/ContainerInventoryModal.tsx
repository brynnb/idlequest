import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import Draggable from "react-draggable";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import { handleItemClick, getBagStartingSlot } from "@utils/itemUtils";
import ActionButton from "@components/Interface/ActionButton";

const ModalContainer = styled.div.attrs({
  className: "modal-container",
})<{ $height: number }>`
  width: 268px;
  height: ${(props) => props.$height}px;
  background-image: url("/images/ui/container/containerbackground.png");
  background-repeat: repeat-y;
  background-size: 100% auto;
  position: absolute;
  z-index: 2000;
  padding-bottom: 16px;
`;

const ModalContent = styled.div.attrs({
  className: "modal-content",
})`
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ModalHeader = styled.div.attrs({
  className: "modal-header",
})`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0px;
  cursor: move;
`;

const ModalTitle = styled.h3.attrs({
  className: "modal-title",
})`
  margin: 0;
  margin-top: 10px;
  color: white;
  font-size: 20px;
  text-align: center;
  width: 100%;
`;

const CloseButton = styled.button.attrs({
  className: "close-button",
})`
  background: none;
  border: none;
  color: #gold;
  font-size: 18px;
  cursor: pointer;
`;

const ContainerInventory = styled.div.attrs({
  className: "container-inventory",
})`
  display: grid;
  grid-template-columns: repeat(2, 0fr);
  justify-content: center;
  margin-top: 30px;
`;

const Slot = styled.div.attrs({
  className: "slot",
})`
  width: 109px;
  height: 109px;
  background-image: url("/images/ui/container/containerslot.png");
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ItemIcon = styled.img.attrs({
  className: "item-icon",
})`
  width: 80px;
  height: 80px;
  object-fit: contain;
`;

const BottomBorder = styled.div.attrs({
  className: "bottom-border",
})`
  width: 100%;
  height: 16px;
  background-image: url("/images/ui/container/containerbackgroundbottomborder.png");
  background-size: 100% 100%;
  position: absolute;
  bottom: 0;
`;

const ContainerIcon = styled.div.attrs({
  className: "container-icon",
})`
  width: 109px;
  height: 109px;
  background-image: url("/images/ui/container/containerslot.png");
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
`;

interface ContainerInventoryModalProps {
  bagSlot: number;
  onClose: () => void;
}

const ContainerInventoryModal: React.FC<ContainerInventoryModalProps> = ({
  bagSlot,
  onClose,
}) => {
  const { characterProfile, setHoveredItem } = usePlayerCharacterStore();
  const { containerPositions, setContainerPosition } = useGameStatusStore();
  const [position, setPosition] = useState(() => {
    if (containerPositions[bagSlot]) {
      return containerPositions[bagSlot];
    }
    const randomX = Math.floor(Math.random() * 401);
    const newPosition = { x: randomX, y: -300 };
    setContainerPosition(bagSlot, newPosition);
    return newPosition;
  });

  const nodeRef = useRef(null);

  const bagItem = characterProfile?.inventory?.find(
    (item) => item.slotid === bagSlot
  );
  if (!bagItem || !bagItem.itemDetails) return null;

  const containerSlots = bagItem.itemDetails.bagslots || 0;
  const containerItems = characterProfile?.inventory?.filter((item) => {
    const bagStart = getBagStartingSlot(bagSlot);
    const bagEnd = bagStart + (containerSlots - 1);
    return item.slotid >= bagStart && item.slotid <= bagEnd;
  });

  const handleDrag = (e: any, data: { x: number; y: number }) => {
    const newPosition = { x: data.x, y: data.y };
    setPosition(newPosition);
    setContainerPosition(bagSlot, newPosition);
  };

  const modalHeight = 120 + Math.ceil(containerSlots / 2) * 114 + 5;

  return (
    <Draggable
      handle=".handle"
      position={position}
      onStop={handleDrag}
      nodeRef={nodeRef}
    >
      <ModalContainer ref={nodeRef} $height={modalHeight + 109}>
        <ModalContent>
          <ModalHeader className="handle">
            <ModalTitle>{bagItem.itemDetails.name}</ModalTitle>
          </ModalHeader>
          <ContainerIcon>
            <ItemIcon
              src={`/icons/${bagItem.itemDetails.icon}.gif`}
              alt={bagItem.itemDetails.name}
              title={bagItem.itemDetails.name}
            />
          </ContainerIcon>
          <ContainerInventory>
            {Array.from({ length: containerSlots }).map((_, index) => {
              const slotId = getBagStartingSlot(bagSlot) + index;
              const inventoryItem = containerItems?.find(
                (item) => item.slotid === slotId
              );
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
                      alt={itemDetails.name}
                      title={itemDetails.name}
                    />
                  )}
                </Slot>
              );
            })}
          </ContainerInventory>
          <ActionButton
            text="Done"
            onClick={onClose}
            customCSS={`margin-top: 5px; width: 120px; margin-bottom: 5px;`}
          />
        </ModalContent>
        <BottomBorder />
      </ModalContainer>
    </Draggable>
  );
};

export default ContainerInventoryModal;
