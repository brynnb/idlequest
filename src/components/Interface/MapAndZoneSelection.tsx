import React from "react";
import styled from "styled-components";
import ZoneSelector from "../ZoneSelector";

const MapContainer = styled.div`
  height: 720px;
  width: 876px;
  position: absolute;
  left: 269px;
  top: 0px;
  background-image: url("/images/maps/fullmap.jpg");
  background-size: cover;
  padding-left:20px
`;


const MapAndZoneSelection: React.FC = () => {
  return (
    <MapContainer>
      <ZoneSelector />
    </MapContainer>
  );
};

export default MapAndZoneSelection;
