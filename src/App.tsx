import { useState } from "react";
import CharacterCreator from "./components/CharacterCreator";
import GameEngine from "./components/GameEngine";
import ResetGameButton from "./components/ResetGameButton";
import StoreDebugger from "./components/StoreDebugger";
import GeneralInventorySlots from "./components/GeneralInventorySlots";
import AddInventoryItem from "./components/AddInventoryItem";
import DeleteAllInventory from "./components/DeleteAllInventory";

function App() {
  const [isRunning, setIsRunning] = useState(false);
  return (
    <div>
      <h1>IdleQuest</h1>
      <ResetGameButton />

      <CharacterCreator />

      <GameEngine isRunning={isRunning} setIsRunning={setIsRunning} />
      <GeneralInventorySlots />
      <AddInventoryItem />
      <DeleteAllInventory />
      <StoreDebugger />
    </div>
  );
}

export default App;
