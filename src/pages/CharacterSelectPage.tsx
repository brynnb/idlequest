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
import useGameStatusStore from "@stores/GameStatusStore";
import races from "@data/json/races.json";
import classes from "@data/json/classes.json";
import deities from "@data/json/deities.json";
import GameEngine from "@/scripts/GameEngine";

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
  grid-template-columns: 280px 500px;
  gap: 60px;
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
`;

const BottomButtons = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  margin-top: 10px;
  justify-content: space-between;
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
  height: 500px;
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
        if (data.value === 1) {
          // Success - now wait for PlayerProfile
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
        const plainProfile = capnpToPlainObject(profile);

        // Build character profile from PlayerProfile data
        const raceData = races.find(
          (r: { id: number }) => r.id === plainProfile.race
        );
        const classData = classes.find(
          (c: { id: number }) => c.id === plainProfile.charClass
        );

        setCharacterProfile({
          id: plainProfile.entityid || plainProfile.spawnId || 0,
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
          platinum: plainProfile.platinum || 0,
          gold: plainProfile.gold || 0,
          silver: plainProfile.silver || 0,
          copper: plainProfile.copper || 0,
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
        // The server sends full item data embedded in each ItemInstance
        const inventoryItems = (plainProfile.inventoryItems || [])
          .filter((item: { name?: string }) => {
            // Valid items have a name
            return item.name && item.name.length > 0;
          })
          .map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any) => ({
              bag: item.bagSlot ?? 0,
              slot: item.slot ?? 0,
              itemid: 0, // Not needed - we have full item details
              charges: item.charges || 0,
              // Include embedded item details directly from server
              itemDetails: {
                name: item.name,
                icon: item.icon,
                ac: item.ac,
                damage: item.damage,
                delay: item.delay,
                hp: item.hp,
                mana: item.mana,
                weight: item.weight,
                slots: item.slots,
                classes: item.classes,
                races: item.races,
                itemclass: item.itemclass,
                itemtype: item.itemtype,
                bagslots: item.bagslots,
                bagsize: item.bagsize,
                // Include stat bonuses
                astr: item.astr,
                asta: item.asta,
                aagi: item.aagi,
                adex: item.adex,
                awis: item.awis,
                aint: item.aint,
                acha: item.acha,
                // Resistances
                mr: item.mr,
                fr: item.fr,
                cr: item.cr,
                dr: item.dr,
                pr: item.pr,
              },
            })
          );

        if (inventoryItems.length > 0) {
          await setInventory(inventoryItems);
        }

        updateAllStats();

        // Load zone data now that we're connected and have entered the world
        GameEngine.getInstance().loadZoneData();

        // Navigate to main game
        navigate("/game");
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
    navigate("/create");
  };

  const handleLogout = () => {
    // Close connection and navigate to login
    WorldSocket.close(false); // false = don't attempt reconnect
    navigate("/");
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
        <EmptyMessage>Loading Characters...</EmptyMessage>
      </Wrapper>
    );
  }

  const getZoneName = (zoneId: number) => {
    const zones = useGameStatusStore.getState().zones;
    const zone = zones.find((z: any) => z.zoneidnumber === zoneId);
    return zone?.long_name || zone?.short_name || "Unknown Location";
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
            {characterSlots.map((character, index) => (
              <SelectionButton
                key={character?.name || `empty-${index}`}
                $isSelected={selectedCharacter?.name === character?.name}
                onClick={() => {
                  if (character) {
                    handleSelectCharacter(character);
                  } else {
                    handleCreateNew();
                  }
                }}
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
            <SelectionButton
              onClick={() => {
                if (selectedCharacter) {
                  setDeleteTarget(selectedCharacter);
                }
              }}
              $isSelected={false}
              $isDisabled={!selectedCharacter}
              disabled={!selectedCharacter}
            >
              DELETE
            </SelectionButton>
            <SelectionButton onClick={handleLogout} $isSelected={false}>
              QUIT
            </SelectionButton>
          </BottomButtons>
        </LeftColumn>

        {/* Right Column - Character Preview */}
        <RightColumn>
          {selectedCharacter ? (
            <>
              <CharacterPreview>
                <CharacterImageContainer>
                  <CharacterImage
                    src="/images/ui/charactercreation/creationviewport.png"
                    alt="Character Preview"
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
