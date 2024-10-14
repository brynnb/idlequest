import React from "react";
import styled from "styled-components";
import { NPCType } from "@entities/NPCType";
import useGameStatusStore from "@stores/GameStatusStore";
import useDialogueStore from "@stores/DialogueStore";
import { getNPCDialogue } from "@utils/getNPCDialogue";

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
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const QuestNPCList: React.FC = () => {
  const { currentZoneNPCs } = useGameStatusStore();
  const { setCurrentDialogue, setCurrentNPC, addDialogueEntry, getDialogueHistory } = useDialogueStore();

  const handleNPCClick = async (npc: NPCType) => {
    setCurrentNPC(npc.name);
    const dialogueHistory = getDialogueHistory(npc.name);
    const dialogue = await getNPCDialogue(npc.name, dialogueHistory);
    if (dialogue) {
      setCurrentDialogue(dialogue);
      addDialogueEntry(npc.name, { npcDialogue: dialogue.dialogue });
    }
  };

  return (
    <NPCListContainer>
      {currentZoneNPCs.map((npc: NPCType) => (
        <NPCItem key={npc.id} onClick={() => handleNPCClick(npc)}>
          {npc.name}
        </NPCItem>
      ))}
    </NPCListContainer>
  );
};

export default QuestNPCList;
