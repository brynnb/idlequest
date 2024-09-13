import { useEffect } from "react";
import classes from "../../data/classes.json";
import useCharacterStore from "../stores/CharacterCreatorStore";
import CharacterClass from "../entities/CharacterClass";
import charCreateCombinations from "../../data/char_create_combinations.json";

const ClassSelector = () => {
  const { selectedClass, setSelectedClass, selectedRace } = useCharacterStore();
  const availableClasses = classes.slice(0, 14);

  // Filter classes based on the selected race
  const compatibleClasses = charCreateCombinations
    .filter(
      (combination) => combination.race === selectedRace?.id // Assuming selectedRace has an id property
    )
    .map((combination) => combination.class);

  const onSelectClass = (charClass: CharacterClass) => {
    setSelectedClass(charClass);
  };

  // Effect to reset selected class if incompatible with new race
  useEffect(() => {
    if (selectedClass && !compatibleClasses.includes(selectedClass.id)) {
      // Reset to the first compatible class if the current selected class is not compatible
      const firstCompatibleClass = availableClasses.find((classItem) =>
        compatibleClasses.includes(classItem.id)
      );
      if (firstCompatibleClass) {
        setSelectedClass(firstCompatibleClass);
      }
    }
  }, [
    selectedRace,
    compatibleClasses,
    selectedClass,
    setSelectedClass,
    availableClasses,
  ]);

  return (
    <div>
      <h2>Class</h2>
      {availableClasses.map((classItem) => (
        <button
          key={classItem.id}
          onClick={() => onSelectClass(classItem)}
          disabled={!compatibleClasses.includes(classItem.id)} // Disable button if not compatible
          style={{
            backgroundColor:
              selectedClass?.id === classItem.id
                ? "#007bff"
                : !compatibleClasses.includes(classItem.id)
                ? "#e0e0e0"
                : "#f8f9fa", // Grey for disabled
            color:
              selectedClass?.id === classItem.id
                ? "white"
                : !compatibleClasses.includes(classItem.id)
                ? "#a0a0a0"
                : "black", // Darker grey for disabled text
            margin: "5px",
            padding: "10px",
            border: "1px solid #ced4da",
            borderRadius: "4px",
            cursor: compatibleClasses.includes(classItem.id)
              ? "pointer"
              : "not-allowed", // Change cursor for disabled
          }}
        >
          {classItem.name}
        </button>
      ))}
    </div>
  );
};

export default ClassSelector;
