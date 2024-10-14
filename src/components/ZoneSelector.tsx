import React, { useEffect, useState, useCallback } from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { getAdjacentZones } from "@utils/zoneUtils";
import Zone from "@entities/Zone";
import ActionButton from "./Interface/ActionButton";
import useGameStatusStore from "@/stores/GameStatusStore";

const ZoneSelector: React.FC = () => {
  const [adjacentZones, setAdjacentZones] = useState<Zone[]>([]);
  const { characterProfile, setCharacterZone } = usePlayerCharacterStore();
  const { setCurrentZone } = useGameStatusStore();

  const fetchAdjacentZones = useCallback(async () => {
    if (characterProfile.zoneId) {
      const zones = await getAdjacentZones(characterProfile.zoneId);
      setAdjacentZones(zones);
    }
  }, [characterProfile.zoneId]);

  useEffect(() => {
    fetchAdjacentZones();
  }, [fetchAdjacentZones]);

  const handleZoneClick = async (zone: Zone) => {
    setCharacterZone(zone.zoneidnumber); //TODO: we shouldn't update in two places, need to either connect or make the game engine rely on the player zone
    setCurrentZone(zone.zoneidnumber);
    await fetchAdjacentZones();
  };

  return (
    <div>
      <h3 style={{ color: "white", fontSize: "35px" }}>Select New Zone:</h3>
      <div>
        {adjacentZones.map((zone) => (
          <ActionButton
            key={zone.id}
            text={zone.long_name}
            onClick={() => handleZoneClick(zone)}
            marginBottom="10px"
            customCSS="font-size: 16px; height: 80px"
          />
        ))}
      </div>
    </div>
  );
};

export default ZoneSelector;
