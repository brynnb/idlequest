import React, { useEffect, useRef } from "react";
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
  left: 270px;
  top: 0px;
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
  display: flex;
  flex-direction: column;
`;

const DialogueEntry = styled.div.attrs({
  className: "dialogue-entry",
})<{ $isPlayer: boolean }>`
  max-width: 80%;
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 12px;
  align-self: ${(props) => (props.$isPlayer ? "flex-end" : "flex-start")};
`;

const QuestionsList = styled.ul`
  list-style-type: none;
  padding: 0;
  align-self: flex-end;
`;

const QuestionItem = styled.li`
  margin-bottom: 10px;
  cursor: pointer;
  color: #150a6e;
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
  color: black;
`;

const loadingAnimation = keyframes`
  0% { content: '.'; }
  33% { content: '..'; }
  66% { content: '...'; }
  100% { content: ''; }
`;

const LoadingText = styled.span`
  &::after {
    content: "";
    animation: ${loadingAnimation} 1.5s infinite;
  }
`;

const NoteDisplay: React.FC = () => {
  const {
    currentDialogue,
    currentNPC,
    setCurrentDialogue,
    addDialogueEntry,
    getDialogueHistory,
    isLoading,
  } = useDialogueStore();
  const dialogueDisplayRef = useRef<HTMLDivElement>(null);

  const handleQuestionClick = async (question: string) => {
    if (currentNPC) {
      addDialogueEntry(currentNPC, {
        npcDialogue: "",
        playerQuestion: question,
        isPlayer: true,
      });
      const dialogueHistory = getDialogueHistory(currentNPC);
      const newDialogue = await getNPCDialogue(currentNPC, dialogueHistory);
      if (newDialogue) {
        setCurrentDialogue(newDialogue);
        addDialogueEntry(currentNPC, {
          npcDialogue: newDialogue.dialogue,
          isPlayer: false,
        });
      }
    }
  };

  const dialogueHistory = currentNPC ? getDialogueHistory(currentNPC) : [];

  useEffect(() => {
    if (dialogueDisplayRef.current) {
      dialogueDisplayRef.current.scrollTop =
        dialogueDisplayRef.current.scrollHeight;
    }
  }, [dialogueHistory, isLoading]);

  return (
    <NoteDisplayContainer>
      <DialogueDisplayContainer>
        <DialogueTitle>
          {currentNPC ? currentNPC.replace(/_/g, " ") : "No NPC Selected"}
        </DialogueTitle>
        <DialogueDisplay ref={dialogueDisplayRef}>
          {currentNPC ? (
            <>
              {dialogueHistory.map((entry, index) => (
                <DialogueEntry key={index} $isPlayer={!!entry.isPlayer}>
                  {entry.isPlayer ? entry.playerQuestion : entry.npcDialogue}
                </DialogueEntry>
              ))}
              {(isLoading || dialogueHistory.length === 0) && (
                <DialogueEntry $isPlayer={false}>
                  <LoadingText>Loading</LoadingText>
                </DialogueEntry>
              )}
              {!isLoading &&
                currentDialogue &&
                Array.isArray(currentDialogue.responses) &&
                currentDialogue.responses.length > 0 && (
                  <QuestionsList>
                    {currentDialogue.responses.map((response, index) => (
                      <QuestionItem
                        key={index}
                        onClick={() =>
                          handleQuestionClick(
                            typeof response === "string"
                              ? response
                              : response.text
                          )
                        }
                      >
                        {typeof response === "string"
                          ? response
                          : response.text}
                      </QuestionItem>
                    ))}
                  </QuestionsList>
                )}
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
