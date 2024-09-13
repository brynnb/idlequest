import { useEffect, useMemo } from "react";
import zones from "../../data/zones.json";
import useCharacterStore from "../stores/CharacterCreatorStore";
import charCreateCombinations from "../../data/char_create_combinations.json";

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

  // Effect to reset selected zone if incompatible with new race or class
  useEffect(() => {
    if (selectedZone && !compatibleZones.includes(selectedZone.zoneidnumber)) {
      const firstCompatibleZone = availableZones.find((zoneItem) =>
        compatibleZones.includes(zoneItem.zoneidnumber)
      );
      if (firstCompatibleZone) {
        setSelectedZone(firstCompatibleZone);
      }
    }
  }, [
    selectedRace,
    selectedClass,
    compatibleZones,
    selectedZone,
    setSelectedZone,
    availableZones,
  ]);

  return (
    <div>
      {availableZones.map((zone) => (
        <button
          key={zone.zoneidnumber}
          onClick={() => onSelectZone(zone.zoneidnumber)}
          disabled={!compatibleZones.includes(zone.zoneidnumber)}
          style={{
            backgroundColor:
              selectedZone?.zoneidnumber === zone.zoneidnumber
                ? "#007bff"
                : !compatibleZones.includes(zone.zoneidnumber)
                ? "#e0e0e0"
                : "#f8f9fa",
            color:
              selectedZone?.zoneidnumber === zone.zoneidnumber
                ? "white"
                : !compatibleZones.includes(zone.zoneidnumber)
                ? "#a0a0a0"
                : "black",
            margin: "5px",
            padding: "10px",
            border: "1px solid #ced4da",
            borderRadius: "4px",
            cursor: compatibleZones.includes(zone.zoneidnumber)
              ? "pointer"
              : "not-allowed",
          }}
        >
          {zone.long_name}
        </button>
      ))}
    </div>
  );
};

export default ZoneSelector;
