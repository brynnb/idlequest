import { useEffect, useMemo } from "react";
import zones from "/data/zones.json";
import useCharacterStore from "@stores/CharacterCreatorStore";
import charCreateCombinations from "/data/char_create_combinations.json";
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
  const { selectedZone, setSelectedZone, selectedRace, selectedClass } =
    useCharacterStore();

  // Get all unique start zones from the combinations
  const allStartZones = useMemo(() => {
    const uniqueZones = new Set(
      charCreateCombinations.map((c) => c.start_zone)
    );
    // Exclude zoneidnumber of 155 for Shar Vahl because cat people aren't classic
    uniqueZones.delete(155);
    return Array.from(uniqueZones);
  }, []);

  // Filter zones based on the selected race and class
  const compatibleZones = useMemo(() => {
    return charCreateCombinations
      .filter(
        (combination) =>
          combination.race === selectedRace?.id &&
          combination.class === selectedClass?.id
      )
      .map((combination) => combination.start_zone);
  }, [selectedRace, selectedClass]);

  // Filter available zones to only include those that are in allStartZones
  const availableZones = useMemo(() => {
    return zones.filter((zone) => allStartZones.includes(zone.zoneidnumber));
  }, [allStartZones]);

  const onSelectZone = (zoneId: number) => {
    const selectedZone = availableZones.find(
      (zone) => zone.zoneidnumber === zoneId
    );
    if (selectedZone) {
      setSelectedZone(selectedZone);
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
            {zone.long_name}
          </SelectionButton>
        ))}
      </ZonesGrid>
    </ZoneSelectorContainer>
  );
};

export default ZoneSelector;
