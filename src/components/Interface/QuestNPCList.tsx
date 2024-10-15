import React from "react";
import styled from "styled-components";
import { NPCType } from "@entities/NPCType";
import useGameStatusStore from "@stores/GameStatusStore";
import useDialogueStore from "@stores/DialogueStore";
import { getNPCDialogue } from "@utils/getNPCDialogue";

const NPCListContainer = styled.div`
  position: absolute;
  left: 30px;
  top: 80px;
  bottom: 20px;
  right: 20px;
  height: 900px;
  width: 219px;
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

const NPCItem = styled.div`
  margin-bottom: 5px;
  font-size: 18px;
  line-height: 23px;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const ParentContainer = styled.div`
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

const QuestNPCList: React.FC = () => {
  const { currentZoneNPCs, currentZone, getZoneLongNameById } = useGameStatusStore();
  const {
    setCurrentDialogue,
    setCurrentNPC,
    addDialogueEntry,
    getDialogueHistory,
  } = useDialogueStore();

  const handleNPCClick = async (npc: NPCType) => {
    setCurrentNPC(npc.name);
    const dialogueHistory = getDialogueHistory(npc.name);
    if (dialogueHistory.length === 0) {
      const dialogue = await getNPCDialogue(npc.name);
      if (dialogue) {
        setCurrentDialogue(dialogue);
        addDialogueEntry(npc.name, { npcDialogue: dialogue.dialogue, isPlayer: false });
      }
    } else {
      setCurrentDialogue(null);
    }
  };

  return (
    <ParentContainer>
      <PaneTitle>{getZoneLongNameById(currentZone)}</PaneTitle>
      <NPCListContainer>
        {currentZoneNPCs.sort((a, b) => a.name.localeCompare(b.name)).map((npc: NPCType) => (
          <NPCItem key={npc.id} onClick={() => handleNPCClick(npc)}>
            {npc.name.replace(/_/g, ' ')}
          </NPCItem>
        ))}
      </NPCListContainer>
    </ParentContainer>
  );
};

export default QuestNPCList;
