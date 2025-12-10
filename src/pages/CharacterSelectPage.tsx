import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import SelectionButton from "@components/Interface/SelectionButton";
import {
  WorldSocket,
  OpCodes,
  PlayerProfile,
  EnterWorld,
  Int,
  CapnpString,
} from "@/net";
import { capnpToPlainObject } from "@/net/capnp-utils";
import useCharacterSelectStore, {
  CharacterSelectEntry,
} from "@stores/CharacterSelectStore";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import races from "@data/json/races.json";
import classes from "@data/json/classes.json";
import deities from "@data/json/deities.json";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 60px;
  height: 100%;
  width: 100%;
`;

const Title = styled.h1`
  font-family: "Times New Roman", Times, serif;
  font-size: 42px;
  color: #2c2c2c;
  margin-bottom: 30px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const CharacterList = styled.div`
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 500px;
  max-height: 600px;
  overflow-y: auto;
`;

const CharacterCard = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: ${({ $isSelected }) =>
    $isSelected ? "rgba(100, 150, 200, 0.3)" : "rgba(0, 0, 0, 0.05)"};
  border: 2px solid
    ${({ $isSelected }) => ($isSelected ? "#4a90d9" : "transparent")};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(100, 150, 200, 0.2);
  }
`;

const CharacterInfo = styled.div`
  flex: 1;
`;

const CharacterName = styled.div`
  font-family: "Times New Roman", Times, serif;
  font-size: 24px;
  font-weight: bold;
  color: #2c2c2c;
`;

const CharacterDetails = styled.div`
  font-family: "Times New Roman", Times, serif;
  font-size: 16px;
  color: #666;
  margin-top: 4px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 30px;
`;

const EmptyMessage = styled.div`
  font-family: "Times New Roman", Times, serif;
  font-size: 18px;
  color: #666;
  text-align: center;
  padding: 40px;
`;

const DeleteButton = styled.button`
  background: rgba(200, 50, 50, 0.8);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-family: "Times New Roman", Times, serif;
  font-size: 14px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(200, 50, 50, 1);
  }
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
  const navigate = useNavigate();
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
  const { setCharacterProfile, setInventory, updateAllStats } =
    usePlayerCharacterStore();

  // Get race/class names
  const getRaceName = (raceId: number) => {
    const race = races.find((r: { id: number }) => r.id === raceId);
    return race?.name || "Unknown";
  };

  const getClassName = (classId: number) => {
    const charClass = classes.find((c: { id: number }) => c.id === classId);
    return charClass?.name || "Unknown";
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
        console.log("PostEnterWorld response:", data.value);
        if (data.value === 1) {
          // Success - now wait for PlayerProfile
          console.log("Enter world approved, waiting for PlayerProfile...");
        } else {
          console.error("Enter world rejected");
          alert("Could not enter world. Please try again.");
        }
      }
    );

    // Register handler for PlayerProfile (full character data)
    WorldSocket.registerOpCodeHandler(
      OpCodes.PlayerProfile,
      PlayerProfile,
      async (profile) => {
        console.log("Received PlayerProfile:", profile);
        const plainProfile = capnpToPlainObject(profile);

        // Build character profile from PlayerProfile data
        const raceData = races.find(
          (r: { id: number }) => r.id === plainProfile.race
        );
        const classData = classes.find(
          (c: { id: number }) => c.id === plainProfile.charClass
        );

        setCharacterProfile({
          id: plainProfile.spawnId || 0,
          name: plainProfile.name,
          lastName: plainProfile.lastName || "",
          race: raceData,
          class: classData,
          deity:
            deities.find((d: { id: number }) => d.id === plainProfile.deity) ||
            deities[0],
          zoneId: plainProfile.zoneId,
          level: plainProfile.level,
          exp: plainProfile.exp || 0,
          curHp: plainProfile.curHp || 0,
          maxHp: Number(plainProfile.maxHp) || 0,
          mana: plainProfile.mana || 0,
          maxMana: Number(plainProfile.maxMana) || 0,
          endurance: plainProfile.endurance || 0,
          attributes: {
            str: plainProfile.str || 75,
            sta: plainProfile.sta || 75,
            cha: plainProfile.cha || 75,
            dex: plainProfile.dex || 75,
            int: plainProfile.intel || 75,
            agi: plainProfile.agi || 75,
            wis: plainProfile.wis || 75,
          },
          inventory: [], // Will be set via setInventory below
          stats: {
            ac: plainProfile.ac || 0,
            atk: plainProfile.attack || 100,
          },
        });

        // Build inventory items from PlayerProfile inventoryItems
        const inventoryItems = (plainProfile.inventoryItems || [])
          .filter((item: { id?: number; itemId?: number }) => {
            const itemId = item.id || item.itemId;
            return itemId && itemId > 0;
          })
          .map(
            (item: {
              slot?: number;
              slotId?: number;
              id?: number;
              itemId?: number;
              charges?: number;
            }) => ({
              slotid: item.slot ?? item.slotId ?? 0,
              itemid: item.id || item.itemId || 0,
              charges: item.charges || 0,
            })
          );

        if (inventoryItems.length > 0) {
          console.log("Setting inventory with", inventoryItems.length, "items");
          await setInventory(inventoryItems);
        }

        updateAllStats();

        // Navigate to main game
        navigate("/game");
      }
    );

    // Send EnterWorld with character name
    console.log("Sending EnterWorld for:", selectedCharacter.name);
    await WorldSocket.sendMessage(OpCodes.EnterWorld, EnterWorld, {
      name: selectedCharacter.name,
      tutorial: 0,
      returnHome: 0,
    });
  };

  const handleCreateNew = () => {
    navigate("/create");
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    character: CharacterSelectEntry
  ) => {
    e.stopPropagation(); // Prevent selecting the character
    setDeleteTarget(character);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    console.log("Deleting character:", deleteTarget.name);

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
      navigate("/");
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <Wrapper>
        <Title>Loading Characters...</Title>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Title>Select Your Character</Title>
      <CharacterList>
        {characters.length === 0 ? (
          <EmptyMessage>
            No characters found. Create a new character to begin your adventure!
          </EmptyMessage>
        ) : (
          characters.map((character) => (
            <CharacterCard
              key={character.id || character.name}
              $isSelected={selectedCharacter?.name === character.name}
              onClick={() => handleSelectCharacter(character)}
            >
              <CharacterInfo>
                <CharacterName>{character.name}</CharacterName>
                <CharacterDetails>
                  Level {character.level} {getRaceName(character.race)}{" "}
                  {getClassName(character.charClass)}
                </CharacterDetails>
              </CharacterInfo>
              <DeleteButton onClick={(e) => handleDeleteClick(e, character)}>
                Delete
              </DeleteButton>
            </CharacterCard>
          ))
        )}
      </CharacterList>
      <ButtonContainer>
        <SelectionButton
          onClick={handleCreateNew}
          $isSelected={false}
          $isDisabled={false}
        >
          Create New
        </SelectionButton>
        <SelectionButton
          onClick={handleEnterWorld}
          $isSelected={false}
          $isDisabled={!selectedCharacter}
          disabled={!selectedCharacter}
        >
          Enter World
        </SelectionButton>
      </ButtonContainer>

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
