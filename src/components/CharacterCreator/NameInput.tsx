import React, { useEffect, useRef } from "react";
import useRandomName from "@hooks/useRandomName";
import useCharacterCreatorStore from "@stores/CharacterCreatorStore";
import SelectionButton from "@components/Interface/SelectionButton";
import styled from "styled-components";
import { eqDataService } from "@utils/eqDataService";

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

const RandomNameButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 15px;
`;

const ValidationMessage = styled.div<{ $isError: boolean }>`
  color: ${(props) => (props.$isError ? "#fabdbd" : "#6bff6b")};
  font-size: 24px;
  text-align: center;
  margin-top: 8px;
  min-height: 20px;
`;

const NameInput: React.FC = () => {
  const { characterName, setCharacterName, nameValidation, setNameValidation } =
    useCharacterCreatorStore();
  const { generateRandomName } = useRandomName();
  const maxLength = Math.max(12, generateRandomName().length);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!characterName || characterName.length < 4) {
        setNameValidation({
          isValid: false,
          isAvailable: false,
          errorMessage:
            characterName.length > 0
              ? "Name must be at least 4 characters"
              : "",
          isValidating: false,
        });
        return;
      }

      setNameValidation({
        isValid: false,
        isAvailable: false,
        errorMessage: "",
        isValidating: true,
      });

      const result = await eqDataService.validateName(characterName);

      if (result) {
        setNameValidation({
          isValid: result.valid,
          isAvailable: result.available,
          errorMessage: result.errorMessage,
          isValidating: false,
        });
      } else {
        setNameValidation({
          isValid: false,
          isAvailable: false,
          errorMessage: "Unable to validate name",
          isValidating: false,
        });
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [characterName, setNameValidation]);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newName = event.target.value;
    newName = newName.replace(/[^a-zA-Z]/g, "");
    newName = newName.charAt(0).toUpperCase() + newName.slice(1).toLowerCase();
    setCharacterName(newName.slice(0, maxLength));
  };

  const handleRandomName = () => {
    setCharacterName(generateRandomName());
  };

  const showValidationMessage =
    characterName.length > 0 && !nameValidation.isValidating;
  const isNameValid = nameValidation.isValid && nameValidation.isAvailable;

  return (
    <NameInputContainer>
      <StyledNameInput
        type="text"
        value={characterName}
        onChange={handleNameChange}
        maxLength={maxLength}
        placeholder="Enter character name"
      />
      <RandomNameButtonContainer>
        <SelectionButton onClick={handleRandomName} $isSelected={false}>
          Random Name
        </SelectionButton>
      </RandomNameButtonContainer>
      <ValidationMessage $isError={!isNameValid}>
        {nameValidation.isValidating
          ? "Checking name..."
          : showValidationMessage
          ? nameValidation.errorMessage ||
            (isNameValid ? "Name is available!" : "")
          : ""}
      </ValidationMessage>
    </NameInputContainer>
  );
};

export default NameInput;
