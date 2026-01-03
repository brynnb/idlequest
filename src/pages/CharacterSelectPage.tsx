import { useEffect, useState } from "react";
import styled from "styled-components";
import useGameScreenStore from "@stores/GameScreenStore";
import SelectionButton from "@components/Interface/SelectionButton";
import {
  WorldSocket,
  OpCodes,
  CharacterState,
  EnterWorld,
  Int,
  CapnpString,
  capnpToPlainObject,
} from "@/net";
import useCharacterSelectStore, {
  CharacterSelectEntry,
} from "@stores/CharacterSelectStore";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import useStaticDataStore from "@stores/StaticDataStore";
import GameEngine from "@/scripts/GameEngine";
import { getRaceImageUrl } from "@/utils/raceImageUtils";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`;

const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: 840px 500px;
  gap: 10px;
  padding: 40px;
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const CharacterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  align-items: center;
`;

const Title = styled.h2`
  font-family: "Times New Roman", Times, serif;
  text-transform: uppercase;
  font-weight: 900;
  font-size: 50px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  text-align: center;
  margin: 0 0 10px 0;
  color: white;
  width: 100%;
`;

const BottomButtons = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: 10px;
  justify-content: space-between;
  width: 690px;
  align-self: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
`;

const CharacterPreview = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const CharacterImageContainer = styled.div`
  position: relative;
  width: 500px;
  height: 750px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CharacterImage = styled.img`
  max-width: 100%;
  max-height: 100%;
`;

const CharacterLabel = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-family: "Times New Roman", Times, serif;
  font-size: 24px;
  font-weight: bold;
  color: white;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  line-height: 1.4;
  z-index: 10;
`;

const LocationInfo = styled.div`
  font-family: "Times New Roman", Times, serif;
  font-size: 20px;
  color: white;
  text-align: center;
  line-height: 1.6;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  font-weight: bold;
`;

const EmptyMessage = styled.div`
  font-family: "Times New Roman", Times, serif;
  font-size: 18px;
  color: white;
  text-align: center;
  padding: 40px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: rgba(255, 255, 255, 0.95);
  padding: 30px;
  border-radius: 8px;
  max-width: 400px;
  text-align: center;
`;

const ModalTitle = styled.h2`
  font-family: "Times New Roman", Times, serif;
  font-size: 24px;
  color: #2c2c2c;
  margin-bottom: 15px;
`;

const ModalText = styled.p`
  font-family: "Times New Roman", Times, serif;
  font-size: 16px;
  color: #666;
  margin-bottom: 25px;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
`;

const ModalButton = styled.button<{ $danger?: boolean }>`
  padding: 10px 25px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: "Times New Roman", Times, serif;
  font-size: 16px;
  background: ${({ $danger }) => ($danger ? "#c83232" : "#666")};
  color: white;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ $danger }) => ($danger ? "#a02828" : "#555")};
  }
`;

const CharacterSelectPage = () => {
  const { setScreen } = useGameScreenStore();
  const [deleteTarget, setDeleteTarget] = useState<CharacterSelectEntry | null>(
    null
  );
  const {
    characters,
    selectedCharacter,
    setSelectedCharacter,
    removeCharacter,
    isLoading,
  } = useCharacterSelectStore();
  const { updateAllStats } = usePlayerCharacterStore();
  const { getClassById, getRaceById } = useStaticDataStore();

  const getClassName = (classId: number) => {
    const charClass = getClassById(classId);
    return charClass?.name || "Unknown";
  };

  const getRaceName = (raceId: number) => {
    const race = getRaceById(raceId);
    return race?.name || "";
  };

  const handleSelectCharacter = (character: CharacterSelectEntry) => {
    setSelectedCharacter(character);
  };

  const handleEnterWorld = async () => {
    if (!selectedCharacter) return;

    // Register handler for PostEnterWorld response
    WorldSocket.registerOpCodeHandler(
      OpCodes.PostEnterWorld,
      Int,
      async (data) => {
        if (data.value === 1) {
          // Success - now wait for PlayerProfile
        } else {
          console.error("Enter world rejected");
          alert("Could not enter world. Please try again.");
        }
      }
    );

    // Register handler for CharacterState (unified character data from server)
    // The PlayerCharacterStore already handles this via initializeCharacterSync,
    // but we need to navigate after receiving it
    WorldSocket.registerOpCodeHandler(
      OpCodes.CharacterState,
      CharacterState,
      async (charState) => {
        // Apply the character state via the store
        const plainData = capnpToPlainObject(charState);
        await usePlayerCharacterStore.getState().applyCharacterState(plainData);

        updateAllStats();

        // Load zone data now that we're connected and have entered the world
        GameEngine.getInstance().loadZoneData();

        // Switch to main game
        setScreen("game");
      }
    );

    // Send EnterWorld with character name
    await WorldSocket.sendMessage(OpCodes.EnterWorld, EnterWorld, {
      name: selectedCharacter.name,
      tutorial: 0,
      returnHome: 0,
    });
  };

  const handleCreateNew = () => {
    setScreen("characterCreate");
  };

  const handleLogout = () => {
    // Close connection and switch to login
    WorldSocket.close(false); // false = don't attempt reconnect
    setScreen("login");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    // Send delete request to server
    await WorldSocket.sendMessage(OpCodes.DeleteCharacter, CapnpString, {
      value: deleteTarget.name,
    });

    // Remove from local state
    removeCharacter(deleteTarget.name);
    setDeleteTarget(null);
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  // Redirect to login if not connected
  useEffect(() => {
    if (!WorldSocket.isConnected) {
      setScreen("login");
    }
  }, [setScreen]);

  if (isLoading) {
    return (
      <Wrapper>
        <EmptyMessage>Loading Characters...</EmptyMessage>
      </Wrapper>
    );
  }

  const getZoneName = (zoneId: number) => {
    const store = useGameStatusStore.getState();
    return (
      store.getZoneLongNameById(zoneId) ||
      store.getZoneNameById(zoneId) ||
      "Unknown Location"
    );
  };

  // Create array of 8 slots, filling empty ones with null
  const characterSlots = Array.from(
    { length: 8 },
    (_, i) => characters[i] || null
  );

  return (
    <Wrapper>
      <ContentContainer>
        {/* Left Column - Character Selection */}
        <LeftColumn>
          <CharacterList>
            <Title>SELECT A CHARACTER</Title>
            {characterSlots.map((character, index) => (
              <SelectionButton
                key={character?.name || `empty-${index}`}
                $isSelected={
                  character !== null &&
                  selectedCharacter?.name === character?.name
                }
                onClick={() => {
                  if (character) {
                    handleSelectCharacter(character);
                  } else {
                    handleCreateNew();
                  }
                }}
                $width="690px"
              >
                {character ? character.name : "CREATE NEW CHARACTER"}
              </SelectionButton>
            ))}
          </CharacterList>

          <BottomButtons>
            <SelectionButton
              onClick={handleEnterWorld}
              $isSelected={false}
              $isDisabled={!selectedCharacter}
              disabled={!selectedCharacter}
            >
              ENTER WORLD
            </SelectionButton>
            <ButtonGroup>
              <SelectionButton
                onClick={() => {
                  if (selectedCharacter) {
                    setDeleteTarget(selectedCharacter);
                  }
                }}
                $isSelected={false}
                $isDisabled={!selectedCharacter}
                disabled={!selectedCharacter}
                $width="150px"
              >
                DELETE
              </SelectionButton>
              <SelectionButton
                onClick={handleLogout}
                $isSelected={false}
                $width="150px"
              >
                QUIT
              </SelectionButton>
            </ButtonGroup>
          </BottomButtons>
        </LeftColumn>

        {/* Right Column - Character Preview */}
        <RightColumn>
          {selectedCharacter ? (
            <>
              <CharacterPreview>
                <CharacterImageContainer
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {/* Race Image (Layer 1) */}
                  <CharacterImage
                    src={getRaceImageUrl(
                      getRaceName(selectedCharacter.race),
                      selectedCharacter.gender === 1 ? "f" : "m"
                    )}
                    alt="Character Preview"
                    style={{
                      position: "absolute",
                      height: "750px",
                      zIndex: 1,
                    }}
                  />

                  {/* Viewport Frame (Layer 2) */}
                  <CharacterImage
                    src="/images/ui/charactercreation/creationviewporttransparent.png"
                    alt="Viewport Frame"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      zIndex: 2,
                      pointerEvents: "none",
                    }}
                  />
                  <CharacterLabel>
                    {getClassName(selectedCharacter.charClass)}
                    <br />
                    Level {selectedCharacter.level}
                  </CharacterLabel>
                </CharacterImageContainer>
              </CharacterPreview>
              <LocationInfo>
                CURRENT LOCATION
                <br />
                {getZoneName(selectedCharacter.zone)}
              </LocationInfo>
            </>
          ) : (
            <EmptyMessage>Select a character to view details</EmptyMessage>
          )}
        </RightColumn>
      </ContentContainer>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ModalOverlay onClick={handleCancelDelete}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Delete Character?</ModalTitle>
            <ModalText>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name}</strong>? This action cannot be
              undone.
            </ModalText>
            <ModalButtons>
              <ModalButton onClick={handleCancelDelete}>Cancel</ModalButton>
              <ModalButton $danger onClick={handleConfirmDelete}>
                Delete
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </Wrapper>
  );
};

export default CharacterSelectPage;
