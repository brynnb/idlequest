import AttributeAllocator from "./AttributeAllocator";
import RaceSelector from "./RaceSelector";
import ClassSelector from "./ClassSelector";
import DeitySelector from "./DeitySelector";
import NameInput from "./NameInput";

const CharacterCreator = () => {
  return (
    <div>
      <h2>Character Creator</h2>
      <NameInput />
      <RaceSelector />
      <ClassSelector />
      <AttributeAllocator />
      <DeitySelector />
    </div>
  );
};

export default CharacterCreator;
