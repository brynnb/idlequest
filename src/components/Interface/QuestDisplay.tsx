import React from "react";
import styled from "styled-components";
import QuestNPCList from "@components/Interface/QuestNPCList";
import NoteDisplay from "@components/Interface/NoteDisplay";

const QuestDisplayContainer = styled.div`
  width: 1000px;
  height: 720px;
  position: absolute;
  left: 00px;
  top: 0;
`;

const NPCListWrapper = styled.div`
  width: 200px;
  height: 100%;
`;

const QuestDisplay: React.FC = () => {
  return (
    <QuestDisplayContainer>
      <NPCListWrapper>
        <QuestNPCList />
      </NPCListWrapper>
      <NoteDisplay />
    </QuestDisplayContainer>
  );
};

export default QuestDisplay;
