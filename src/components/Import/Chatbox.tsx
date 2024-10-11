import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import useChatStore from "../../stores/ChatStore";
import VerticalScroll from "../Interface/VerticalScroll";

const ChatContainer = styled.div.attrs({ className: "chat-container" })`
  width: 821px;
  height: 308px;
  overflow-y: auto;
  left: 267px;
  top: 722px;
  position: absolute;
  font-size: 10px;
  background-image: url("/images/chatbg.png");
  background-size: cover;

  padding-left: 80px;
  padding-top: 50px;
  font-size: 18px;

  /* screenshot, experience, gained experience */
  .yellow-text {
    color: #fce803;
  }

  /* user inflicts damage, local chat */
  .black-text {
    color: #281e16;
  }

  /* emotes, spell casting messages,  */
  .blue-text {
    color: #150a6e;
  }

  /* user receives damage, shouts */
  .red-text {
    color: #cf081b;
  }

  /* ooc messages */
  .green-text {
    color: #55873a;
  }

  /* /who lookups, PMs */
  .purple-text {
    color: #7e476b;
  }

  /* group chat messages */
  .teal-text {
    color: #80e8de;
  }
`;

const ChatMessage = styled.div`
  margin-bottom: 0px;
`;

const ChatBox: React.FC = () => {
  const { messages } = useChatStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ChatContainer>
      {messages.map((message) => (
        <ChatMessage key={message.id}>{message.text}</ChatMessage>
      ))}
      <div ref={chatEndRef} />
      <VerticalScroll contentHeight={100} onScroll={() => {}} />
    </ChatContainer>
  );
};

export default ChatBox;
