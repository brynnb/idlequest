import React from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useStaticDataStore from "@stores/StaticDataStore";
import { InventorySlot } from "@entities/InventorySlot";
import { WorldSocket, OpCodes } from "@/net";
import styled from "styled-components";
import { getRaceImageUrl } from "@/utils/raceImageUtils";

const Container = styled.div<{ $hasCursorItem: boolean }>`
  width: 221px;
  height: 436px;
  position: absolute;
  right: 132px;
  top: 287px;
  transform: translate(50%, -50%);
  cursor: ${({ $hasCursorItem }) => ($hasCursorItem ? "pointer" : "default")};
  z-index: 1000;
  overflow: hidden;
  /* background-color: #000;  User mentioned it was a black box, keep it black background useful for loading? */
  border-radius: 4px; /* Optional, but looks nicer */
`;

const CharacterImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
`;

const PersonaView: React.FC = () => {
  const { characterProfile } = usePlayerCharacterStore();
  const { getRaceById } = useStaticDataStore();

  const cursorItem = characterProfile?.inventory?.find(
    (item) => item.bag === 0 && item.slot === InventorySlot.Cursor
  );

  const handleClick = () => {
    if (cursorItem && WorldSocket.isConnected) {
      // Send to server - server handles the auto-equip/inventory logic
      WorldSocket.sendMessage(OpCodes.AutoPlaceCursorItem, null, null);
    }
  };

  const getRaceName = (): string => {
    if (!characterProfile?.race) return "";

    // Handle both object (if hydrated) and ID (if raw)
    if (typeof characterProfile.race === "object" && "name" in characterProfile.race) {
      return characterProfile.race.name;
    } else if (typeof characterProfile.race === "number") {
      const race = getRaceById(characterProfile.race);
      return race?.name || "";
    }
    return "";
  };

  const raceName = getRaceName();
  // Default to male if gender is missing, explicitly check for 1 (female)
  // Assuming characterProfile.gender: 0 = male, 1 = female
  const gender = characterProfile?.gender === 1 ? "f" : "m";

  return (
    <Container onClick={handleClick} $hasCursorItem={!!cursorItem}>
      {raceName && (
        <CharacterImage
          src={getRaceImageUrl(raceName, gender)}
          alt="Character Persona"
        />
      )}
    </Container>
  );
};

export default PersonaView;
