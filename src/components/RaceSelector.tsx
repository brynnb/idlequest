import React from "react";
import { Race } from "../entities/Race";

interface RaceSelectorProps {
  races: Race[];
  selectedRace: Race | null;
  onSelectRace: (race: Race) => void;
}

const RaceSelector: React.FC<RaceSelectorProps> = ({
  races,
  selectedRace,
  onSelectRace,
}) => {
  return (
    <div>
      {races.map((race) => (
        <button
          key={race.id}
          onClick={() => onSelectRace(race)}
          style={{
            backgroundColor:
              selectedRace?.id === race.id ? "#007bff" : "#f8f9fa",
            color: selectedRace?.id === race.id ? "white" : "black",
            margin: "5px",
            padding: "10px",
            border: "1px solid #ced4da",
            borderRadius: "4px",
          }}
        >
          {race.name}
        </button>
      ))}
    </div>
  );
};

export default RaceSelector;
