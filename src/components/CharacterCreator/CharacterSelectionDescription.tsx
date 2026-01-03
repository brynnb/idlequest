import React, { useMemo } from "react";
import useCharacterStore from "@stores/CharacterCreatorStore";
import useStaticDataStore from "@stores/StaticDataStore";

const CharacterDescription: React.FC = () => {
  const { selectedRace, selectedClass, selectedDeity, selectedZone } =
    useCharacterStore();
  const getCombinationDescription = useStaticDataStore((state) => state.getCombinationDescription);

  const description = useMemo(() => {
    if (!selectedRace || !selectedClass || !selectedDeity) {
      return "Please select a race, class, and deity to see your character description.";
    }

    const matchingDescription = getCombinationDescription(
      selectedRace.id,
      selectedClass.id,
      selectedDeity.id
    );

    if (matchingDescription) {
      return matchingDescription;
    } else {
      return `You are a ${selectedRace.name} ${selectedClass.name
        } who worships ${selectedDeity.name}. 
              Your journey begins in ${selectedZone?.longName || "an unknown location"
        }. 
             `;
    }
  }, [selectedRace, selectedClass, selectedDeity, selectedZone, getCombinationDescription]);

  return (
    <div className="character-description">
      <h2>Character Description</h2>
      <p>{description}</p>
    </div>
  );
};

export default CharacterDescription;
