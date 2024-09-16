import React, { useMemo } from "react";
import useCharacterStore from "../stores/CharacterCreatorStore";
import raceClassDeityDescriptions from "../../data/race_class_deity_descriptions.json";

const CharacterDescription: React.FC = () => {
  const { selectedRace, selectedClass, selectedDeity, selectedZone } =
    useCharacterStore();

  const description = useMemo(() => {
    if (!selectedRace || !selectedClass || !selectedDeity) {
      return "Please select a race, class, and deity to see your character description.";
    }

    const matchingDescription = raceClassDeityDescriptions.find(
      (desc) =>
        desc.race_id === selectedRace.id &&
        desc.class_id === selectedClass.id &&
        desc.deity_id === selectedDeity.id
    );

    if (matchingDescription) {
      return matchingDescription.description;
    } else {
      return `You are a ${selectedRace.name} ${
        selectedClass.name
      } who worships ${selectedDeity.name}. 
              Your journey begins in ${
                selectedZone?.long_name || "an unknown location"
              }. 
             `;
    }
  }, [selectedRace, selectedClass, selectedDeity, selectedZone]);

  return (
    <div className="character-description">
      <h2>Character Description</h2>
      <p>{description}</p>
    </div>
  );
};

export default CharacterDescription;
