import { useState } from "react";
import zonesData from "../data/zones.json";
import CharacterCreator from "./components/CharacterCreator";
import ClassSelector from "./components/ClassSelector";
import GameEngine from "./components/GameEngine";
import ZoneSelector from "./components/ZoneSelector";
import Zone from "./entities/Zone";
import RaceSelector from "./components/RaceSelector";
import CharacterClass from "./entities/CharacterClass";

function App() {
  const [character, setCharacter] = useState({ name: "" });
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(
    null
  );
  const [isRunning, setIsRunning] = useState(false);
  const zones = (zonesData as Zone[]).slice(0, 10);
  return (
    <div>
      <h1>IdleQuest</h1>
      <CharacterCreator character={character} setCharacter={setCharacter} />
      <ClassSelector
        selectedClass={selectedClass}
        onSelectClass={setSelectedClass}
      />
      <ZoneSelector
        zones={zones}
        selectedZone={selectedZone}
        onSelectZone={setSelectedZone}
      />
      <GameEngine isRunning={isRunning} setIsRunning={setIsRunning} />
      <RaceSelector />
    </div>
  );
}

export default App;
