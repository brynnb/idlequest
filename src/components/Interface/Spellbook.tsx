import React from "react";
import styled from "styled-components";

const SpellbookContainer = styled.div`
  height: 720px;
  width: 900px;
  position: absolute;
  left: 267px;
  top: 0px;
  background-image: url("/images/ui/spellbook.png");
  background-size: cover;
`;

const Spellbook: React.FC = () => {
  return <SpellbookContainer />;
};

export default Spellbook;

