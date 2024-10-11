import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import useChatStore from "../../stores/ChatStore";

const ChatContainer = styled.div`
  width: 397px;
  height: 164px;
  overflow-y: auto;
  left: 179px;
  top: 412px;
  position: absolute;
  font-size: 10px;
`;

const ChatMessage = styled.div`
  margin-bottom: 2px;
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
    </ChatContainer>
  );
};

export default ChatBox;
