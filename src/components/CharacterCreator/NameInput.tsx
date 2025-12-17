import React from "react";
import useRandomName from "@hooks/useRandomName";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import SelectionButton from "@components/Interface/SelectionButton";
import styled from "styled-components";

const NameInputContainer = styled.div`
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
`;

const StyledNameInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.7);
  border: 1px solid #444;
  border-radius: 4px;
  padding: 12px;
  color: #e0e0e0;
  font-size: 24px;
  outline: none;

  &::placeholder {
    color: rgba(224, 224, 224, 0.7);
  }
`;

const NameInput: React.FC = () => {
  const { characterName, setCharacterName } = useCharacterCreatorStore();
  const { generateRandomName } = useRandomName();
  const maxLength = Math.max(12, generateRandomName().length);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newName = event.target.value;
    newName = newName.replace(/[^a-zA-Z]/g, ""); // Remove non-alphabetic characters
    newName = newName.charAt(0).toUpperCase() + newName.slice(1).toLowerCase(); // Capitalize first letter, lowercase rest
    setCharacterName(newName.slice(0, maxLength)); // Limit length
  };

  const handleRandomName = () => {
    setCharacterName(generateRandomName());
  };

  return (
    <NameInputContainer>
      <StyledNameInput
        type="text"
        value={characterName}
        onChange={handleNameChange}
        maxLength={maxLength}
        placeholder="Enter character name"
      />
      <SelectionButton onClick={handleRandomName} $isSelected={false}>
        Random Name
      </SelectionButton>
    </NameInputContainer>
  );
};

export default NameInput;
