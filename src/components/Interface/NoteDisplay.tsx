import React from "react";
import styled from "styled-components";
import QuestNPCList from "@components/Interface/QuestNPCList";
import useDialogueStore from "@stores/DialogueStore";
import { getNPCDialogue } from "@utils/getNPCDialogue";

const NoteDisplayContainer = styled.div.attrs({
  className: "note-display-container",
})`
  height: 720px;
  width: 900px;
  position: absolute;
  left: 267px;
  top: 0px;
  background-image: url("/images/ui/notebackground.png");
  background-size: cover;
  display: flex;
`;

const NPCListWrapper = styled.div.attrs({
  className: "npc-list-wrapper",
})`
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
`;

const DialogueDisplayContainer = styled.div.attrs({
  className: "dialogue-display-container",
})`
  position: relative;
  width: 100%;
  height: 100%;
`;

const DialogueDisplay = styled.div.attrs({
  className: "dialogue-display",
})`
  width: 400px;
  height: 400px;
  position: absolute;
  top: 130px;
  left: 170px;
  color: black;
  font-size: 20px;
  overflow-y: auto;
`;

const QuestionsList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const QuestionItem = styled.li`
  margin-bottom: 10px;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const NoteDisplay: React.FC = () => {
  const { currentDialogue, currentNPC, setCurrentDialogue, addDialogueEntry, getDialogueHistory } = useDialogueStore();

  const handleQuestionClick = async (question: string) => {
    if (currentNPC) {
      addDialogueEntry(currentNPC, { npcDialogue: currentDialogue?.dialogue || '', playerQuestion: question });
      const dialogueHistory = getDialogueHistory(currentNPC);
      const newDialogue = await getNPCDialogue(currentNPC, dialogueHistory);
      if (newDialogue) {
        setCurrentDialogue(newDialogue);
        addDialogueEntry(currentNPC, { npcDialogue: newDialogue.dialogue });
      }
    }
  };

  return (
    <NoteDisplayContainer>
      <DialogueDisplayContainer>
        <DialogueDisplay>
          {currentDialogue ? (
            <>
              <p>{currentDialogue.dialogue}</p>
              {Array.isArray(currentDialogue.questions) && currentDialogue.questions.length > 0 ? (
                <QuestionsList>
                  {currentDialogue.questions.map((question, index) => (
                    <QuestionItem key={index} onClick={() => handleQuestionClick(question)}>
                      {question}
                    </QuestionItem>
                  ))}
                </QuestionsList>
              ) : null}
            </>
          ) : (
            <p>No dialogue available</p>
          )}
        </DialogueDisplay>
      </DialogueDisplayContainer>
      <NPCListWrapper>
        <QuestNPCList />
      </NPCListWrapper>
    </NoteDisplayContainer>
  );
};

export default NoteDisplay;
