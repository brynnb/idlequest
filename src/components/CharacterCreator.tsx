import AttributeAllocator from "./AttributeAllocator";
import RaceSelector from "./RaceSelector";
import ClassSelector from "./ClassSelector";
import DeitySelector from "./DeitySelector";

const CharacterCreator = () => {
  return (
    <div>
      <h2>Character Creator</h2>
      <RaceSelector />
      <ClassSelector />
      <AttributeAllocator />
      <DeitySelector />
    </div>
  );
};

export default CharacterCreator;
