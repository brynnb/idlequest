import React, { useEffect, useState } from "react";
import styled from "styled-components";
import ZoneSelector from "@components/ZoneSelector";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";

const MapContainer = styled.div<{ $backgroundImage: string }>`
  height: 720px;
  width: 878px;
  position: absolute;
  left: 270px;
  top: 0px;
  background: url(${(props) => props.$backgroundImage}) 48px 36px /
      calc(100% - 92px) 648px,
    url("/images/ui/charactercreation/creationviewport.png") 20px 20px /
      calc(100% - 40px) 680px,
    url("/images/ui/charactercreation/charactercreatorbackground.png") center
      center / cover;
  background-repeat: no-repeat, no-repeat, no-repeat;
  padding-left: 20px;
`;

const CurrentZoneDisplay = styled.div`
  position: absolute;
  right: 60px;
  top: 640px;
  font-size: 30px;
  color: rgba(0, 0, 0, 0.6);
  text-shadow: 0px 1px 0px rgba(210, 210, 210, 0.3),
    0px -1px 0px rgba(0, 0, 0, 1);
`;

const MapAndZoneSelection: React.FC = () => {
  const [backgroundImage, setBackgroundImage] = useState(
    "/images/maps/fullmap.jpg"
  );
  const zoneId = usePlayerCharacterStore(
    (state) => state.characterProfile?.zoneId
  );
  const { getZoneNameById, getZoneLongNameById } = useGameStatusStore();

  useEffect(() => {
    if (!zoneId) return;

    const zoneName = getZoneNameById(zoneId);
    if (!zoneName) return;

    const img = new Image();
    img.src = `/images/atlas_images/${zoneName.toLowerCase()}.png`;

    img.onload = () => {
      setBackgroundImage(`/images/atlas_images/${zoneName.toLowerCase()}.png`);
    };

    img.onerror = () => {
      setBackgroundImage("/images/maps/fullmap.jpg");
    };
  }, [zoneId, getZoneNameById]);

  return (
    <>
      <ZoneSelector />
      <MapContainer $backgroundImage={backgroundImage}>
        {zoneId && (
          <CurrentZoneDisplay>
            Current Zone: {getZoneLongNameById(zoneId)}
          </CurrentZoneDisplay>
        )}
      </MapContainer>
    </>
  );
};

export default MapAndZoneSelection;
