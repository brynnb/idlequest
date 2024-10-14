import AttributeAllocator from "./AttributeAllocator";
import RaceSelector from "./RaceSelector";
import ClassSelector from "./ClassSelector";
import DeitySelector from "./DeitySelector";
import NameInput from "./NameInput";
import ZoneSelector from "./StartingZoneSelector";
import SubmitCharacter from "./SubmitCharacter";
import CharacterDescription from "./CharacterSelectionDescription";
import { Link } from "react-router-dom";

const CharacterCreator = () => {
  return (
    <div>
      <h2>Character Creator</h2>
      <Link to="/">
        <SubmitCharacter />
      </Link>
      <NameInput />
      <RaceSelector />
      <ClassSelector />
      <AttributeAllocator />
      <DeitySelector />
      <ZoneSelector />
      <CharacterDescription />
    </div>
  );
};

export default CharacterCreator;
