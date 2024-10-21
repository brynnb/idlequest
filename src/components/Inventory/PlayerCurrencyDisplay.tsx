import React from "react";
import styled from "styled-components";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";

const CurrencyContainer = styled.div`
  position: absolute;
  right: 272px;
  top: 587px;
  width: 663px;
  height: 132px;
  background-image: url("/images/ui/currencybackground.png");
  background-size: cover;
  background-position: center;
  color: white;
  font-size: 25px;
`;

const CurrencyItem = styled.div<{ $index: number }>`
  position: absolute;
  top: 50px;
  left: ${(props) => (props.$index - 1) * pixelsApart}px;
  min-width: 50px;
  text-align: center;
  white-space: nowrap;
`;

const CurrencyTextContainer = styled.div`
  position: absolute;
  top: 2px;
  left: 45px;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
`;

const pixelsApart = 155;

const PlayerCurrencyDisplay: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();

  return (
    <CurrencyContainer>
      <CurrencyTextContainer>
        <CurrencyItem $index={1}>{characterProfile.platinum || 0}</CurrencyItem>
        <CurrencyItem $index={2}>{characterProfile.gold || 0}</CurrencyItem>
        <CurrencyItem $index={3}>{characterProfile.silver || 0}</CurrencyItem>
        <CurrencyItem $index={4}>{characterProfile.copper || 0}</CurrencyItem>
      </CurrencyTextContainer>
    </CurrencyContainer>
  );
};

export default PlayerCurrencyDisplay;
