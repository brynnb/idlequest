import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import { useInventoryActions } from "@hooks/useInventoryActions";
import { useInventorySelling } from "@hooks/useInventorySelling";
import PageSelection from "../Interface/PageSelection";

const Container = styled.div.attrs({ className: "macro-buttons-container" })`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const MacroButtonsGrid = styled.div.attrs({ className: "macro-buttons-grid" })`
  display: grid;
  grid-template-columns: repeat(2, 95px);
  grid-template-rows: repeat(3, 95px);
  gap: 14px;
`;

const MacroButton = styled.button.attrs({ className: "macro-button" })<{
  $isPressed: boolean;
}>`
  width: 95px;
  height: 95px;
  background-image: ${({ $isPressed }) =>
    $isPressed
      ? "url('/images/ui/macro/macrobuttonpress.png')"
      : "url('/images/ui/macro/macrobutton.png')"};
  background-size: cover;
  border: none;
  cursor: pointer;
  color: black;
  font-size: 20px;
  font-family: "Times New Roman", Times, serif;
  font-weight: bold;
  outline: none;
  text-align: center;
  &:focus {
    outline: none;
  }
`;

const MacroButtons = () => {
  const [page, setPage] = useState(1);
  const [pressedButtons, setPressedButtons] = useState<{
    [key: number]: boolean;
  }>({});

  const navigate = useNavigate();
  const { sellGeneralInventory } = useInventorySelling();
  const { setCharacterProfile, clearInventory } = usePlayerCharacterStore();
  const resetCharacterCreator = useCharacterCreatorStore(
    (state) => state.resetStore
  );
  const { addItemToInventoryByItemId, handleEquipAllItems } =
    useInventoryActions();

  const MACRO_PAGES = ["1", "2", "3", "4", "5"];

  const handlePageChange = (direction: "left" | "right") => {
    setPage((prev) => {
      if (direction === "left") {
        return Math.max(1, prev - 1);
      } else {
        return Math.min(5, prev + 1);
      }
    });
  };

  const handleMacroButtonPress = (num: number) => {
    setPressedButtons((prev) => ({ ...prev, [num]: true }));
  };

  const handleMacroButtonRelease = (num: number) => {
    setPressedButtons((prev) => ({ ...prev, [num]: false }));
  };

  const handleResetGame = () => {
    setCharacterProfile({});
    resetCharacterCreator();
    console.log("Game has been reset!");
    navigate("/create");
  };

  const handleDeleteAllInventory = () => {
    clearInventory();
  };

  const handleAddTestItem = async () => {
    addItemToInventoryByItemId(15093);
  };

  const handleAddTestItem2 = async () => {
    addItemToInventoryByItemId(5024);
  };

  const renderMacroButton = (num: number) => {
    switch (num) {
      case 1:
        return "Start New Game";
      case 2:
        return "Equip All Items";
      case 3:
        return "Delete All Inventory";
      case 4:
        return "Sell General Inventory";
      case 5:
        return "Add Test Item";
      case 6:
        return "Add Test Item 2";
      default:
        return num.toString();
    }
  };

  const handleMacroButtonClick = (num: number) => {
    switch (num) {
      case 1:
        handleResetGame();
        break;
      case 2:
        handleEquipAllItems();
        break;
      case 3:
        handleDeleteAllInventory();
        break;
      case 4:
        sellGeneralInventory(true);
        break;
      case 5:
        handleAddTestItem();
        break;
      case 6:
        handleAddTestItem2();
        break;
      default:
        console.log(`Button ${num} clicked`);
    }
  };

  return (
    <Container>
      <PageSelection
        pages={MACRO_PAGES}
        currentPage={page.toString()}
        onPageChange={handlePageChange}
      />
      <MacroButtonsGrid>
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <MacroButton
            key={num}
            $isPressed={pressedButtons[num] || false}
            onMouseDown={() => handleMacroButtonPress(num)}
            onMouseUp={() => handleMacroButtonRelease(num)}
            onMouseLeave={() => handleMacroButtonRelease(num)}
            onClick={() => handleMacroButtonClick(num)}
          >
            {renderMacroButton(num)}
          </MacroButton>
        ))}
      </MacroButtonsGrid>
    </Container>
  );
};

export default MacroButtons;
