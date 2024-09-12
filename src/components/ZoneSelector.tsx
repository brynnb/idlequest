import { useEffect } from "react";
import zones from "../../data/zones.json";
import useCharacterStore from "../stores/CharacterCreatorStore";
import charCreateCombinations from "../../data/char_create_combinations.json";

const ZoneSelector = () => {
  const { selectedZone, setSelectedZone, selectedRace, selectedClass } =
    useCharacterStore();

  // Filter zones based on the selected race and class
  const compatibleZones = charCreateCombinations
    .filter(
      (combination) =>
        combination.race === selectedRace?.id &&
        combination.class === selectedClass?.id // Check both race and class
    )
    .map((combination) => combination.start_zone); // Assuming start_zone is the zone ID

  // Filter available zones to only include those that have entries in the JSON
  const availableZones = zones.filter((zone) =>
    compatibleZones.includes(zone.zoneidnumber)
  );

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
          disabled={!compatibleZones.includes(zone.zoneidnumber)} // Disable button if not compatible
          style={{
            backgroundColor:
              selectedZone?.id === zone.zoneidnumber
                ? "#007bff"
                : !compatibleZones.includes(zone.zoneidnumber)
                ? "#e0e0e0"
                : "#f8f9fa", // Grey for disabled
            color:
              selectedZone?.id === zone.zoneidnumber
                ? "white"
                : !compatibleZones.includes(zone.zoneidnumber)
                ? "#a0a0a0"
                : "black", // Darker grey for disabled text
            margin: "5px",
            padding: "10px",
            border: "1px solid #ced4da",
            borderRadius: "4px",
            cursor: compatibleZones.includes(zone.zoneidnumber)
              ? "pointer"
              : "not-allowed", // Change cursor for disabled
          }}
        >
          {zone.long_name}
        </button>
      ))}
    </div>
  );
};

export default ZoneSelector;
