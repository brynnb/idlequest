import { useEffect } from "react";
import useCharacterStore from "@stores/CharacterCreatorStore";
import useStaticDataStore, { ClassData } from "@stores/StaticDataStore";
import styled from "styled-components";
import SelectionButton from "../Interface/SelectionButton";

interface ClassSelectorProps {
  onClassSelect?: (classId: number) => void;
}

const ClassSelectorContainer = styled.div``;

const ClassSelector = ({ onClassSelect }: ClassSelectorProps) => {
  const { selectedClass, setSelectedClass, selectedRace } = useCharacterStore();
  const classes = useStaticDataStore((state) => state.classes);
  const combinations = useStaticDataStore(
    (state) => state.charCreateCombinations
  );

  // Get first 14 classes (playable classes) sorted by name
  const availableClasses = classes
    .slice(0, 14)
    .sort((a, b) => a.name.localeCompare(b.name));

  const compatibleClasses = combinations
    .filter((combo) => combo.race === selectedRace?.id)
    .map((combo) => combo.class);

  const onSelectClass = (charClass: ClassData) => {
    setSelectedClass(charClass);
    if (onClassSelect) {
      onClassSelect(charClass.id);
    }
  };

  useEffect(() => {
    if (selectedClass && !compatibleClasses.includes(selectedClass.id)) {
      const firstCompatibleClass = availableClasses.find((classItem) =>
        compatibleClasses.includes(classItem.id)
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
      {availableClasses.map((classItem) => (
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
