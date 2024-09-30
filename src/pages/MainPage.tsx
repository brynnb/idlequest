import { useEffect, useState } from "react";
import AddInventoryItem from "../components/AddInventoryItem";
import DeleteAllInventory from "../components/DeleteAllInventory";
import EquipAllItems from "../components/EquipAllItems";
import EquippedItemsInventory from "../components/EquippedItemsInventory";
import GameEngine from "../components/GameEngine";
import GeneralInventorySlots from "../components/GeneralInventorySlots";
import ItemInformationDisplay from "../components/ItemInformationDisplay";
import useGameStatusStore from "../stores/GameStatusStore";
import usePlayerCharacterStore from "../stores/PlayerCharacterStore";

const MainPage = () => {
  const { hoveredItem } = usePlayerCharacterStore();
  const { initializeZones } = useGameStatusStore();

  useEffect(() => {
    initializeZones();
  }, []);

  const [isRunning, setIsRunning] = useState(false);
  return (
    <>
      <GameEngine isRunning={isRunning} setIsRunning={setIsRunning} />
      <GeneralInventorySlots />
      <EquippedItemsInventory />
      <AddInventoryItem />
      <DeleteAllInventory />
      <EquipAllItems />
      <ItemInformationDisplay
        item={hoveredItem}
        isVisible={hoveredItem !== null}
        // isVisible={true}
      />
    </>
  );
};

export default MainPage;
