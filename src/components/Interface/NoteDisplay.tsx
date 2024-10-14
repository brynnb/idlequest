import React from "react";
import styled from "styled-components";

const NoteDisplayContainer = styled.div`
  height: 720px;
  width: 900px;
  position: absolute;
  left: 267px;
  top: 0px;
  background-image: url("/images/ui/notebackground.png");
  background-size: cover;
`;

const NoteDisplay: React.FC = () => {
  return <NoteDisplayContainer />;
};

export default NoteDisplay;

