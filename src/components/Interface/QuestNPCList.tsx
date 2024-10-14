import React from "react";
import styled from "styled-components";
import { NPCType } from "@entities/NPCType";
import useGameStatusStore from "@stores/GameStatusStore";

const NPCListContainer = styled.div`
  width: 200px;
  height: 600px;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
`;

const NPCItem = styled.div`
  margin-bottom: 5px;
`;

const QuestNPCList: React.FC = () => {
  const { currentZoneNPCs } = useGameStatusStore();

  return (
    <NPCListContainer>
      {currentZoneNPCs.map((npc: NPCType) => (
        <NPCItem key={npc.id}>{npc.name}</NPCItem>
      ))}
    </NPCListContainer>
  );
};

export default QuestNPCList;
