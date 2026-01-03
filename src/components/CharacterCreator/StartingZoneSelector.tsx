import { useEffect, useMemo } from "react";
import useCharacterStore from "@stores/CharacterCreatorStore";
import useStaticDataStore from "@stores/StaticDataStore";
import styled from "styled-components";
import SelectionButton from "../Interface/SelectionButton";

const ZoneSelectorContainer = styled.div`
  display: flex;
  gap: 20px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 50px;
`;

const RightColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ScrollableZones = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 350px;
  max-height: 800px;
  overflow-y: auto;
  padding-right: 10px;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
  }
  &::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 3px;
  }
`;

const ZoneButton = styled.button<{
  $isSelected: boolean;
  $isDisabled?: boolean;
}>`
  width: 345px;
  height: 45px;
  background-image: ${({ $isSelected }) =>
    $isSelected
      ? "url('/images/ui/actionbuttonpress.png')"
      : "url('/images/ui/actionbutton.png')"};
  background-size: 100% 100%;
  background-repeat: no-repeat;
  border: none;
  cursor: ${({ $isDisabled }) => ($isDisabled ? "not-allowed" : "pointer")};
  outline: none;
  color: ${({ $isDisabled }) => ($isDisabled ? "#363333" : "black")};
  font-family: "Times New Roman", Times, serif;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  opacity: ${({ $isDisabled }) => ($isDisabled ? 0.6 : 1)};
  white-space: nowrap;
  font-size: 24px;
  text-overflow: ellipsis;
  overflow: hidden;
  &:focus {
    outline: none;
  }
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

const DescriptionBox = styled.div`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.7);
  border: 1px solid #444;
  border-radius: 4px;
  padding: 20px;
  color: #e0e0e0;
  font-size: 24px;
  line-height: 1.6;
  min-height: 400px;
  overflow-y: auto;
`;

const WelcomeMessage = styled.div`
  font-style: italic;
  color: #a67c52;
  margin-bottom: 20px;
  font-size: 22px;
  border-bottom: 1px solid #444;
  padding-bottom: 15px;
`;

const ZoneText = styled.div`
  font-size: 24px;
  text-align: left;
`;

const ZoneSelector = () => {
  const { selectedZone, setSelectedZone, selectedRace, selectedClass, selectedDeity } =
    useCharacterStore();
  const { zones, startZones, getZoneDescription } = useStaticDataStore();

  const currentZoneDesc = useMemo(() => {
    if (!selectedZone) return null;
    return getZoneDescription(selectedZone.zoneidnumber);
  }, [selectedZone, getZoneDescription]);

  // Get all unique start zone IDs from the dedicated startZones table
  const allStartZones = useMemo(() => {
    const uniqueIds = Array.from(
      new Set(startZones.map((sz) => sz.zoneIdNumber))
    );
    // Exclude zoneidnumber of 155 for Shar Vahl (Wah Shir)
    return uniqueIds.filter((id) => id !== 155);
  }, [startZones]);

  // Filter compatible zones based on the selected race, class, and deity from startZones table
  const compatibleZones = useMemo(() => {
    if (!selectedRace || !selectedClass || !selectedDeity) return [];

    return startZones
      .filter(
        (sz) =>
          sz.playerRace === selectedRace.id &&
          sz.playerClass === selectedClass.id &&
          sz.playerDeity === selectedDeity.id
      )
      .map((sz) => sz.zoneIdNumber);
  }, [selectedRace, selectedClass, selectedDeity, startZones]);

  // Filter available zones to only include those that are in allStartZones
  // This deduplicates the UI options so "Qeynos City" appears once
  const availableZones = useMemo(() => {
    const filtered = zones.filter((zone) =>
      allStartZones.includes(zone.zoneidnumber)
    );

    // Final deduplication by ID just in case the zone table itself has duplicates
    const uniqueZones: typeof filtered = [];
    const seenIds = new Set<number>();

    for (const zone of filtered) {
      if (!seenIds.has(zone.zoneidnumber)) {
        uniqueZones.push(zone);
        seenIds.add(zone.zoneidnumber);
      }
    }
    return uniqueZones;
  }, [allStartZones, zones]);

  const onSelectZone = (zoneId: number) => {
    const zoneObj = availableZones.find(
      (zone) => zone.zoneidnumber === zoneId
    );
    if (zoneObj) {
      setSelectedZone(zoneObj);
    }
  };

  // Effect to set the first available compatible zone
  useEffect(() => {
    if (!selectedZone || !compatibleZones.includes(selectedZone.zoneidnumber)) {
      const firstCompatibleZone = availableZones.find((zoneItem) =>
        compatibleZones.includes(zoneItem.zoneidnumber)
      );
      if (firstCompatibleZone) {
        setSelectedZone(firstCompatibleZone);
      }
    }
  }, [compatibleZones, availableZones, selectedZone, setSelectedZone]);

  return (
    <ZoneSelectorContainer>
      <ScrollableZones>
        {availableZones.map((zone) => (
          <ZoneButton
            key={zone.zoneidnumber}
            onClick={() => onSelectZone(zone.zoneidnumber)}
            disabled={!compatibleZones.includes(zone.zoneidnumber)}
            $isSelected={selectedZone?.zoneidnumber === zone.zoneidnumber}
            $isDisabled={!compatibleZones.includes(zone.zoneidnumber)}
          >
            {zone.longName}
          </ZoneButton>
        ))}
      </ScrollableZones>

      <RightColumn>
        <Title>Choose Your Starting Zone</Title>
        <DescriptionBox>
          {selectedZone ? (
            <>
              <ZoneText>
                {currentZoneDesc?.description ||
                  `The journey of a thousand leagues begins with a single step. Here in ${selectedZone.longName}, your path through the realm of Norrath commences.`}
              </ZoneText>
              <WelcomeMessage style={{ marginTop: '20px', borderTop: '1px solid #444', borderBottom: 'none', paddingTop: '15px' }}>
                {currentZoneDesc?.welcome || `Welcome to ${selectedZone.longName}`}
              </WelcomeMessage>
            </>
          ) : (
            "Select a starting zone to see its description."
          )}
        </DescriptionBox>
      </RightColumn>
    </ZoneSelectorContainer>
  );
};

export default ZoneSelector;
