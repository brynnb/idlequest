import { useState } from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { getClassName } from "@utils/characterUtils";
import AttributeAllocator from "./AttributeAllocator";
import RaceSelector from "./RaceSelector";
import ClassSelector from "./ClassSelector";
import DeitySelector from "./DeitySelector";
import NameInput from "./NameInput";
import ZoneSelector from "./StartingZoneSelector";
import SubmitCharacter from "./SubmitCharacter";
import CharacterDescription from "./CharacterSelectionDescription";
import { Link } from "react-router-dom";
import styled from "styled-components";

const MainContainer = styled.div`
  display: grid;
  grid-template-columns: 220px 500px 220px 260px;
  gap: 20px;
  height: 1040px;
  width: 1400px;
`;

const CharacterCreator = () => {
  const { characterProfile, setCharacterProfile } = usePlayerCharacterStore();

  const handleClassSelection = (selectedClass: number) => {
    setCharacterProfile((prev) => ({
      ...prev,
      class: {
        id: selectedClass,
        name: getClassName(selectedClass),
      },
    }));
  };

  const canSubmitCharacter = () => {
    return (
      characterProfile.name &&
      characterProfile.race &&
      characterProfile.class?.id &&
      characterProfile.deity?.id &&
      characterProfile.startingZone
    );
  };

  return (
    <MainContainer>
      <RaceSelector />
      <div className="second-column">
        <div className="second-column-top">
          <img
            src="/images/ui/charactercreation/creationviewport.png"
            alt="Creation Viewport"
            style={{ maxWidth: "500px" }}
          />
        </div>
        <div className="second-column-bottom">
          <NameInput />
        </div>
      </div>

      <div className="third-column">
        <ClassSelector onSelect={handleClassSelection} />
      </div>
      <div className="fourth-column">
        <AttributeAllocator />
        <Link to="/">
          <SubmitCharacter />
        </Link>
      </div>
      {/* <ZoneSelector /> */}
      {/* <DeitySelector /> */}
      {/* <CharacterDescription /> */}
    </MainContainer>
  );
};

export default CharacterCreator;
