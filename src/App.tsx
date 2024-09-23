import React, { useEffect, useState } from "react";
import { zoneCache } from "./utils/zoneCache";
import usePlayerCharacterStore from "./stores/PlayerCharacterStore";
import CharacterCreator from "./components/CharacterCreator";
import GameEngine from "./components/GameEngine";
import ResetGameButton from "./components/ResetGameButton";
import StoreDebugger from "./components/StoreDebugger";
import GeneralInventorySlots from "./components/GeneralInventorySlots";
import AddInventoryItem from "./components/AddInventoryItem";
import DeleteAllInventory from "./components/DeleteAllInventory";
import EquippedItemsInventory from "./components/EquippedItemsInventory";
import EquipAllItems from "./components/EquipAllItems";
import ItemInformationDisplay from "./components/ItemInformationDisplay";

function App() {
  const { hoveredItem } = usePlayerCharacterStore();

  useEffect(() => {
    zoneCache.initialize();
  }, []);

  const [isRunning, setIsRunning] = useState(false);

  return (
    <div>
      <h1>IdleQuest</h1>
      <ResetGameButton />
      <CharacterCreator />
      <GameEngine isRunning={isRunning} setIsRunning={setIsRunning} />
      <GeneralInventorySlots />
      <EquippedItemsInventory />
      <AddInventoryItem />
      <DeleteAllInventory />
      <EquipAllItems />
      <ItemInformationDisplay 
        item={hoveredItem} 
        isVisible={hoveredItem !== null}
      />
      <StoreDebugger />
    </div>
  );
}

export default App;
