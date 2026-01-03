import React, { useEffect, useCallback, useRef } from "react";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import { eqDataService, Zone } from "@utils/eqDataService";
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
  const fetchingRef = useRef(false);
  const lastZoneIdRef = useRef<number | null>(null);

  const fetchAdjacentZones = useCallback(async (zoneId: number) => {
    // Prevent duplicate requests for the same zone
    if (fetchingRef.current || zoneId === lastZoneIdRef.current) {
      return;
    }

    fetchingRef.current = true;
    lastZoneIdRef.current = zoneId;

    try {
      const zones = await eqDataService.getAdjacentZones(zoneId);
      setAdjacentZones(zones);
    } catch (error) {
      console.error("Failed to fetch adjacent zones:", error);
      setAdjacentZones([]);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // Refresh adjacent zones when character's zone changes
  useEffect(() => {
    if (characterProfile.zoneId) {
      fetchAdjacentZones(characterProfile.zoneId);
    }
  }, [fetchAdjacentZones, characterProfile.zoneId]);

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

    // Update local state - this will trigger the useEffect to fetch adjacent zones
    setCharacterZone(zone.zoneidnumber);
    setCurrentZone(zone.zoneidnumber);
    // Reset lastZoneIdRef so the new zone's adjacent zones will be fetched
    lastZoneIdRef.current = null;
  };

  return (
    <ParentContainer>
      <PaneTitle>Travel to...</PaneTitle>
      <ZoneListContainer>
        {adjacentZones.map((zone) => (
          <ActionButton
            key={zone.id}
            text={zone.long_name || "Unknown Zone"}
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
