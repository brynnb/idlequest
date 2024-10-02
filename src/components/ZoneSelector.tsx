import React, { useEffect, useState, useCallback } from 'react';
import usePlayerCharacterStore from '../stores/PlayerCharacterStore';
import { getAdjacentZones } from '../utils/zoneUtils';
import Zone from '../entities/Zone';

const ZoneSelector: React.FC = () => {
  const [adjacentZones, setAdjacentZones] = useState<Zone[]>([]);
  const { characterProfile, setCharacterZone } = usePlayerCharacterStore();

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
    setCharacterZone(zone.zoneidnumber);
    await fetchAdjacentZones();
  };

  return (
    <div>
      <h3>Select New Zone:</h3>
      <div>
        {adjacentZones.map((zone) => (
          <button key={zone.id} onClick={() => handleZoneClick(zone)}>
            {zone.long_name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ZoneSelector;