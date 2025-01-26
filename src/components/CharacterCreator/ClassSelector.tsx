import { useEffect } from "react";
import classes from "/data/classes.json";
import useCharacterStore from "@stores/CharacterCreatorStore";
import CharacterClass from "@entities/CharacterClass";
import charCreateCombinations from "/data/char_create_combinations.json";
import styled from "styled-components";
import SelectionButton from "../Interface/SelectionButton";

interface CharCreateCombination {
  race: number;
  class: number;
}

interface ClassSelectorProps {
  onClassSelect?: (classId: number) => void;
}

const ClassSelectorContainer = styled.div``;

const ClassSelector = ({ onClassSelect }: ClassSelectorProps) => {
  const { selectedClass, setSelectedClass, selectedRace } = useCharacterStore();
  const availableClasses = classes
    .slice(0, 14)
    .sort((a: CharacterClass, b: CharacterClass) =>
      a.name.localeCompare(b.name)
    );

  const compatibleClasses = charCreateCombinations
    .filter(
      (combination: CharCreateCombination) =>
        combination.race === selectedRace?.id
    )
    .map((combination: CharCreateCombination) => combination.class);

  const onSelectClass = (charClass: CharacterClass) => {
    setSelectedClass(charClass);
    if (onClassSelect) {
      onClassSelect(charClass.id);
    }
  };

  useEffect(() => {
    if (selectedClass && !compatibleClasses.includes(selectedClass.id)) {
      const firstCompatibleClass = availableClasses.find(
        (classItem: CharacterClass) => compatibleClasses.includes(classItem.id)
      );
      if (firstCompatibleClass) {
        setSelectedClass(firstCompatibleClass);
        if (onClassSelect) {
          onClassSelect(firstCompatibleClass.id);
        }
      }
    }
  }, [
    selectedRace,
    compatibleClasses,
    selectedClass,
    setSelectedClass,
    availableClasses,
    onClassSelect,
  ]);

  return (
    <ClassSelectorContainer>
      {availableClasses.map((classItem: CharacterClass) => (
        <SelectionButton
          key={classItem.id}
          onClick={() => onSelectClass(classItem)}
          disabled={!compatibleClasses.includes(classItem.id)}
          $isSelected={selectedClass?.id === classItem.id}
          $isDisabled={!compatibleClasses.includes(classItem.id)}
        >
          {classItem.name}
        </SelectionButton>
      ))}
    </ClassSelectorContainer>
  );
};

export default ClassSelector;
