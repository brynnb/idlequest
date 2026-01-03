import React from 'react';
import styled from 'styled-components';
import useRecipeStore from '@stores/RecipeStore';

const ForgeContainer = styled.div`
  width: 268px;
  background-image: url("/images/ui/container/containerbackground.png");
  background-repeat: repeat-y;
  background-size: 100% auto;
  padding-bottom: 16px;
  position: relative;
  height: 520px;
`;

const ForgeContent = styled.div`
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ForgeTitle = styled.h3`
  margin: 0;
  margin-top: 10px;
  color: white;
  font-size: 18px;
  text-align: center;
  width: 100%;
`;

const ComponentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  justify-content: center;
  margin-top: 10px;
  gap: 0;
`;

const Slot = styled.div<{ $hasItem?: boolean; $isMissing?: boolean }>`
  width: 109px;
  height: 109px;
  background-image: url("/images/ui/container/containerslot.png");
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  ${(props) => props.$isMissing && `
    &::after {
      content: '';
      position: absolute;
      inset: 10px;
      border: 2px solid #ff4444;
      border-radius: 4px;
      pointer-events: none;
    }
  `}
`;

const ItemIcon = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
`;

const QuantityBadge = styled.span`
  position: absolute;
  bottom: 15px;
  right: 15px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
`;

const BottomBorder = styled.div`
  width: 100%;
  height: 16px;
  background-image: url("/images/ui/container/containerbackgroundbottomborder.png");
  background-size: 100% 100%;
  position: absolute;
  bottom: 0;
`;

interface ForgeSlotsProps {
  playerInventory?: Map<number, number>; // itemId -> quantity owned
}

const ForgeSlots: React.FC<ForgeSlotsProps> = ({ playerInventory = new Map() }) => {
  const { selectedRecipeDetails } = useRecipeStore();

  const components = selectedRecipeDetails?.components || [];

  // Always show 8 slots in a 2x4 grid
  const TOTAL_SLOTS = 8;

  return (
    <ForgeContainer>
      <ForgeContent>
        <ForgeTitle>Forge</ForgeTitle>
        <ComponentGrid>
          {Array.from({ length: TOTAL_SLOTS }).map((_, index) => {
            const comp = components[index];

            if (comp) {
              const owned = playerInventory.get(comp.itemId) || 0;
              const isMissing = owned < comp.quantity;

              return (
                <Slot
                  key={`forge-slot-${index}`}
                  $hasItem={true}
                  $isMissing={isMissing}
                  title={`${comp.itemName} (Need: ${comp.quantity}, Have: ${owned})`}
                >
                  <ItemIcon
                    src={`/icons/${comp.itemIcon}.gif`}
                    alt={comp.itemName}
                    onError={(e) => {
                      // Fallback for missing icons
                      (e.target as HTMLImageElement).src = '/icons/0.gif';
                    }}
                  />
                  {comp.quantity > 1 && (
                    <QuantityBadge>{comp.quantity}</QuantityBadge>
                  )}
                </Slot>
              );
            }

            // Empty slot
            return (
              <Slot key={`forge-slot-${index}`} />
            );
          })}
        </ComponentGrid>
      </ForgeContent>
      <BottomBorder />
    </ForgeContainer>
  );
};

export default ForgeSlots;
