import { useState } from 'react';
import usePlayerCharacterStore from '@stores/PlayerCharacterStore';
import { getClassName } from '@utils/characterUtils';
import AttributeAllocator from "./AttributeAllocator";
import RaceSelector from "./RaceSelector";
import ClassSelector from "./ClassSelector";
import DeitySelector from "./DeitySelector";
import NameInput from "./NameInput";
import ZoneSelector from "./StartingZoneSelector";
import SubmitCharacter from "./SubmitCharacter";
import CharacterDescription from "./CharacterSelectionDescription";
import { Link } from "react-router-dom";

const CharacterCreator = () => {
  const { characterProfile, setCharacterProfile } = usePlayerCharacterStore();

  const handleClassSelection = (selectedClass: number) => {
    setCharacterProfile(prev => ({
      ...prev,
      class: {
        id: selectedClass,
        name: getClassName(selectedClass)
      }
    }));
  };

  const canSubmitCharacter = () => {
    return (
      characterProfile.name &&
      characterProfile.race &&
      characterProfile.class?.id &&
      characterProfile.deity?.id &&
      characterProfile.startingZone
    );
  };

  return (
    <div>
      <h2>Character Creator</h2>
      <Link to="/">
        <SubmitCharacter />
      </Link>
      <NameInput />
      <RaceSelector />
      <ClassSelector onSelect={handleClassSelection} />
      <AttributeAllocator />
      <DeitySelector />
      <ZoneSelector />
      <CharacterDescription />
    </div>
  );
};

export default CharacterCreator;
