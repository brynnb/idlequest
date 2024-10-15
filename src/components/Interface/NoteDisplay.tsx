import React from "react";
import styled, { keyframes } from "styled-components";
import useDialogueStore from "@stores/DialogueStore";
import { getNPCDialogue } from "@utils/getNPCDialogue";
import { LoadingJokeUtil } from "@utils/getRandomLoadingJoke";

const NoteDisplayContainer = styled.div.attrs({
  className: "note-display-container",
})`
  height: 722px;
  width: 900px;
  background-image: url("/images/ui/notebackground.png");
  background-size: cover;
  position: absolute;
  left:270px;
  top:0px;
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
  width: 550px;
  height: 400px;
  position: absolute;
  top: 170px;
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

const DialogueTitle = styled.div`
  font-size: 23px;
  font-weight: bold;
  top: 140px;
  position: absolute;
  left: 360px;
  text-align: center;
  color: black
`;

const loadingAnimation = keyframes`
  0% { content: '.'; }
  33% { content: '..'; }
  66% { content: '...'; }
  100% { content: ''; }
`;

const LoadingText = styled.span`
  &::after {
    content: '';
    animation: ${loadingAnimation} 1.5s infinite;
  }
`;

const NoteDisplay: React.FC = () => {
  const { currentDialogue, currentNPC, setCurrentDialogue, addDialogueEntry, getDialogueHistory, isLoading } = useDialogueStore();

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
        <DialogueTitle>
          {currentNPC ? currentNPC.replace(/_/g, ' ') : 'No NPC Selected'}
        </DialogueTitle>
        <DialogueDisplay>
          {isLoading ? (
            <p><LoadingText>(Loading) {LoadingJokeUtil.getRandomLoadingJoke()}</LoadingText></p>
          ) : currentDialogue ? (
            <>
              <p>{currentDialogue.dialogue}</p>
              {Array.isArray(currentDialogue.responses) && currentDialogue.responses.length > 0 ? (
                <QuestionsList>
                  {currentDialogue.responses.map((response, index) => (
                    <QuestionItem 
                      key={index} 
                      onClick={() => handleQuestionClick(typeof response === 'string' ? response : response.text)}
                    >
                      {typeof response === 'string' ? response : response.text}
                    </QuestionItem>
                  ))}
                </QuestionsList>
              ) : null}
            </>
          ) : (
            <p>Select an NPC to begin a conversation.</p>
          )}
        </DialogueDisplay>
      </DialogueDisplayContainer>
    </NoteDisplayContainer>
  );
};

export default NoteDisplay;
