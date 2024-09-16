import { useState } from "react";
import CharacterCreator from "./components/CharacterCreator";
import GameEngine from "./components/GameEngine";

function App() {
  const [isRunning, setIsRunning] = useState(false);
  return (
    <div>
      <h1>IdleQuest</h1>
      <CharacterCreator />
      <GameEngine isRunning={isRunning} setIsRunning={setIsRunning} />
      {/* <StoreDebugger /> */}
    </div>
  );
}

export default App;
