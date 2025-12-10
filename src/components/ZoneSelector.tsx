import React, { useEffect, useCallback } from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { getAdjacentZones } from "@utils/zoneUtils";
import Zone from "@entities/Zone";
import ActionButton from "./Interface/ActionButton";
import useGameStatusStore from "@/stores/GameStatusStore";
import styled from "styled-components";
import { WorldSocket, OpCodes, RequestClientZoneChange } from "@/net";

const ZoneListContainer = styled.div`
  position: absolute;
  left: 19px;
  top: 80px;
  bottom: 20px;
  right: 20px;
  height: 900px;
  width: 240px;
  overflow-y: scroll;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.5) transparent;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 4px;
  }
`;

const ParentContainer = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 246px;
  height: 1080px;
  background-image: url("/images/ui/lootpanebackground.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
  color: white;
  overflow-y: auto;
  padding-left: 24px;
`;

const PaneTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  top: 35px;
  left: 25px;
  position: absolute;
`;

const ZoneSelector: React.FC = () => {
  const [adjacentZones, setAdjacentZones] = React.useState<Zone[]>([]);
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
    // Send zone change request to server
    console.log(
      "Requesting zone change to:",
      zone.long_name,
      zone.zoneidnumber
    );
    await WorldSocket.sendMessage(
      OpCodes.RequestClientZoneChange,
      RequestClientZoneChange,
      {
        zoneId: zone.zoneidnumber,
        instanceId: 0,
        x: zone.safe_x || 0,
        y: zone.safe_y || 0,
        z: zone.safe_z || 0,
        heading: 0,
        type: 1, // fromZone = 1
      }
    );

    // Update local state
    setCharacterZone(zone.zoneidnumber);
    setCurrentZone(zone.zoneidnumber);
    await fetchAdjacentZones();
  };

  return (
    <ParentContainer>
      <PaneTitle>Travel to...</PaneTitle>
      <ZoneListContainer>
        {adjacentZones.map((zone) => (
          <ActionButton
            key={zone.id}
            text={zone.long_name}
            customCSS="
              font-size: 22px;
              width: 230px;
              min-height: 30px;
              height: auto;
              margin-bottom: 5px;
              white-space: normal;
              padding: 10px 8px;
              line-height: 1.2;
              text-transform: none;
              
            "
            onClick={() => handleZoneClick(zone)}
          />
        ))}
      </ZoneListContainer>
    </ParentContainer>
  );
};

export default ZoneSelector;
