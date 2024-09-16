import AttributeAllocator from "./AttributeAllocator";
import RaceSelector from "./RaceSelector";
import ClassSelector from "./ClassSelector";
import DeitySelector from "./DeitySelector";
import NameInput from "./NameInput";
import ZoneSelector from "./ZoneSelector";
import SubmitCharacter from "./SubmitCharacter";

const CharacterCreator = () => {
  return (
    <div>
      <h2>Character Creator</h2>
      <NameInput />
      <RaceSelector />
      <ClassSelector />
      <AttributeAllocator />
      <DeitySelector />
      <ZoneSelector />
      <SubmitCharacter />
    </div>
  );
};

export default CharacterCreator;
