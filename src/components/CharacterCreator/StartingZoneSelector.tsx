import { useEffect, useMemo } from "react";
import useCharacterStore from "@stores/CharacterCreatorStore";
import useStaticDataStore from "@stores/StaticDataStore";
import styled from "styled-components";
import SelectionButton from "../Interface/SelectionButton";

const ZoneSelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const ZonesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
  width: 100%;
`;

const Title = styled.h2`
  font-family: "Times New Roman", Times, serif;
  text-transform: uppercase;
  font-weight: 900;
  font-size: 32px;
  text-shadow: 2px 2px 4px #d6d2d2;
  text-align: center;
  margin-bottom: 20px;
`;

const ZoneSelector = () => {
  const { selectedZone, setSelectedZone, selectedRace, selectedClass, selectedDeity } =
    useCharacterStore();
  const { zones, startZones } = useStaticDataStore();

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
      <Title>Choose Your Starting Zone</Title>
      <ZonesGrid>
        {availableZones.map((zone) => (
          <SelectionButton
            key={zone.zoneidnumber}
            onClick={() => onSelectZone(zone.zoneidnumber)}
            disabled={!compatibleZones.includes(zone.zoneidnumber)}
            $isSelected={selectedZone?.zoneidnumber === zone.zoneidnumber}
            $isDisabled={!compatibleZones.includes(zone.zoneidnumber)}
          >
            {zone.longName}
          </SelectionButton>
        ))}
      </ZonesGrid>
    </ZoneSelectorContainer>
  );
};

export default ZoneSelector;
