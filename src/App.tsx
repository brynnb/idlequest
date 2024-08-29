import { useState } from "react";
import racesData from "../data/races.json";
import zonesData from "../data/zones.json";
import CharacterCreator from "./components/CharacterCreator";
import ClassSelector from "./components/ClassSelector";
import GameEngine from "./components/GameEngine";
import ZoneSelector from "./components/ZoneSelector";
import Race from "./entities/Race";
import Zone from "./entities/Zone";
import RaceSelector from "./components/RaceSelector";

function App() {
  const [character, setCharacter] = useState({ name: "" });
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(
    null
  );
  const [isRunning, setIsRunning] = useState(true);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const zones = (zonesData as Zone[]).slice(0, 10);
  const races = (racesData as Race[]).slice(0, 10);
  return (
    <div>
      <h1>Idle Game</h1>
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
      <RaceSelector
        races={races}
        selectedRace={selectedRace}
        onSelectRace={setSelectedRace}
      />
    </div>
  );
}

export default App;
