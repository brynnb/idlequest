import React, { useEffect } from 'react';
import useRandomName from '../hooks/useRandomName';
import useCharacterCreatorStore from '../stores/CharacterCreatorStore';

const NameInput: React.FC = () => {
  const { characterName, setCharacterName } = useCharacterCreatorStore();
  const { generateRandomName } = useRandomName();
  const maxLength = Math.max(12, generateRandomName().length);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newName = event.target.value;
    newName = newName.replace(/[^a-zA-Z]/g, ''); // Remove non-alphabetic characters
    newName = newName.charAt(0).toUpperCase() + newName.slice(1).toLowerCase(); // Capitalize first letter, lowercase rest
    setCharacterName(newName.slice(0, maxLength)); // Limit length
  };

  const handleRandomName = () => {
    setCharacterName(generateRandomName());
  };

  return (
    <div>
      <input
        type="text"
        value={characterName}
        onChange={handleNameChange}
        maxLength={maxLength}
        placeholder="Enter character name"
      />
      <button onClick={handleRandomName}>Random Name</button>
    </div>
  );
};

export default NameInput;
