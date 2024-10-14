import React from "react";
import styled from "styled-components";
import QuestNPCList from "@components/Interface/QuestNPCList";

const NoteDisplayContainer = styled.div`
  height: 720px;
  width: 900px;
  position: absolute;
  left: 267px;
  top: 0px;
  background-image: url("/images/ui/notebackground.png");
  background-size: cover;
  display: flex;
`;

const NPCListWrapper = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
`;

const NoteDisplay: React.FC = () => {
  return (
    <NoteDisplayContainer>
      <NPCListWrapper>
        <QuestNPCList />
      </NPCListWrapper>
    </NoteDisplayContainer>
  );
};

export default NoteDisplay;
