import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import useStaticDataStore, { RaceData } from "@stores/StaticDataStore";
import styled from "styled-components";
import SelectionButton from "../Interface/SelectionButton";

const RaceSelectorContainer = styled.div``;

const RaceSelector = () => {
  const { selectedRace, setSelectedRace, resetAttributes } =
    useCharacterCreatorStore((state) => ({
      selectedRace: state.selectedRace,
      setSelectedRace: state.setSelectedRace,
      resetAttributes: state.resetAttributes,
    }));

  const races = useStaticDataStore((state) => state.races);
  const playableRaces = races.filter((race) => race.is_playable);

  const onSelectRace = (race: RaceData) => {
    setSelectedRace(race);
    resetAttributes();
  };

  return (
    <RaceSelectorContainer>
      {playableRaces.map((race) => (
        <SelectionButton
          key={race.id}
          onClick={() => onSelectRace(race)}
          $isSelected={selectedRace?.id === race.id}
        >
          {race.name}
        </SelectionButton>
      ))}
    </RaceSelectorContainer>
  );
};

export default RaceSelector;
