import races from "../../data/races.json";
import Race from "../entities/Race";
import useCharacterCreatorStore from "../stores/CharacterCreatorStore";

const RaceSelector = () => {
  const { selectedRace, setSelectedRace } = useCharacterCreatorStore();

  // Filter races to only include those that are playable
  const playableRaces = races.filter(race => race.is_playable);

  const onSelectRace = (race: Race) => {
    setSelectedRace(race);
  };

  return (
    <div>
      {playableRaces.map((race) => (
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
