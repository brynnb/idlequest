import useCharacterCreatorStore from "../stores/CharacterCreatorStore";
import AttributeAllocator from "./AttributeAllocator";
import RaceSelector from "./RaceSelector";
import ClassSelector from "./ClassSelector";
import CharacterClass from "../entities/CharacterClass";
import Race from "../entities/Race";
import CharacterCreationAttributes from "../entities/CharacterCreationAttributes";
import DeitySelector from "./DeitySelector";

const CharacterCreator = () => {
  // Access the store state and actions
  const {
    selectedRace,
    selectedClass,
    selectedDeity,
    setSelectedDeity,
    attributes,
    setSelectedRace,
    setSelectedClass,
    setAttributes,
  } = useCharacterCreatorStore();

  const handleRaceSelect = (race: Race) => {
    setSelectedRace(race); // Set the selected race in the store
  };

  const handleClassSelect = (charClass: CharacterClass) => {
    setSelectedClass(charClass); // Set the selected class in the store
  };

  const handleAttributeChange = (
    newAttributes: CharacterCreationAttributes
  ) => {
    setAttributes(newAttributes); // Update attributes in the store
  };

  return (
    <div>
      <h2>Character Creator</h2>
      <RaceSelector />
      <ClassSelector />
      <AttributeAllocator
        attributes={attributes}
        onAttributesChange={handleAttributeChange}
      />
      <DeitySelector />
    </div>
  );
};

export default CharacterCreator;
