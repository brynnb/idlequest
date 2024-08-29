import React, { useState } from "react";
import AttributeAllocator from "./AttributeAllocator";
import { CharacterCreationAttributes } from "../types/CharacterCreationAttributes";
import characterCreationData from "../../data/char_create_point_allocations.json";

interface CharacterCreatorProps {
  character: { name: string };
  setCharacter: React.Dispatch<React.SetStateAction<{ name: string }>>;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({
  character,
  setCharacter,
}) => {
  const initialAttributes =
    characterCreationData.find((entry) => entry.id === 1) ||
    characterCreationData[0];

  const [attributes, setAttributes] =
    useState<CharacterCreationAttributes>(initialAttributes);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCharacter((prev) => ({ ...prev, name: event.target.value }));
  };

  const handleAllocationsChange = (
    newAllocations: CharacterCreationAttributes
  ) => {
    setAttributes(newAllocations);
  };

  return (
    <div>
      <h2>Character Creator</h2>
      <div>
        <label htmlFor="characterName">Character Name: </label>
        <input
          id="characterName"
          type="text"
          value={character.name}
          onChange={handleNameChange}
          placeholder="Enter character name"
        />
      </div>
      <AttributeAllocator
        attributes={attributes}
        totalPoints={25}
        onAllocationsChange={handleAllocationsChange}
      />
    </div>
  );
};

export default CharacterCreator;
