import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import useChatStore, { MessageType } from "@stores/ChatStore";
import VerticalScroll from "../Interface/VerticalScroll";

const ChatContainer = styled.div.attrs({ className: "chat-container" })`
  width: 902px;
  height: 300px;
  left: 266px;
  top: 722px;
  padding-top: 40px;
  padding-bottom: 20px;
  position: absolute;
  background-image: url("/images/chatbg.png");
  background-size: cover;
  font-size: 20px;
  line-height: 1.2;
  display: flex;

  .yellow-text {
    color: #fce803;
  }

  .black-text {
    color: #281e16;
  }

  .blue-text {
    color: #150a6e;
  }

  .red-text {
    color: #cf081b;
  }

  .green-text {
    color: #55873a;
  }

  .purple-text {
    color: #7e476b;
  }

  .teal-text {
    color: #80e8de;
  }

  .name-text {
    color: #d1d2d3;
  }
`;

const ChatContent = styled.div.attrs({ className: "chat-content" })`
  width: calc(100%);
  height: 300px;
  padding-left: 100px;

  padding-right: 20px;
  padding-bottom: 10px;
  box-sizing: border-box;
  overflow-y: scroll;

  &::-webkit-scrollbar {
    width: 12px;
    background: #000000ad;
  }

  &::-webkit-scrollbar-thumb {
    background: #c6b5ad;
    border-radius: 6px;
    
  }

  &::-webkit-scrollbar-track {
    border-radius: 6px;
  }
`;

const ChatMessage = styled.div`
  margin-bottom: 0px;
`;

const getMessageClass = (type: MessageType): string => {
  switch (type) {
    case MessageType.SCREENSHOT:
    case MessageType.EXPERIENCE_GAIN:
      return "yellow-text";
    case MessageType.COMBAT_OUTGOING:
    case MessageType.LOCAL_CHAT:
    case MessageType.LOOT:
      return "black-text";
    case MessageType.EMOTE:
    case MessageType.SPELL_CAST:
      return "blue-text";
    case MessageType.COMBAT_INCOMING:
    case MessageType.SHOUT:
    case MessageType.DEATH:
      return "red-text";
    case MessageType.OOC:
      return "green-text";
    case MessageType.WHO_LOOKUP:
    case MessageType.PRIVATE_MESSAGE:
      return "purple-text";
    case MessageType.GROUP_CHAT:
    case MessageType.RAID_CHAT:
      return "teal-text";
    case MessageType.GUILD_CHAT:
      return "green-text";
    case MessageType.TRADE:
    case MessageType.AUCTION:
      return "white-text";
    case MessageType.SKILL_INCREASE:
    case MessageType.QUEST_UPDATE:
    case MessageType.ACHIEVEMENT:
    case MessageType.FACTION_CHANGE:
    case MessageType.SYSTEM:
      return "yellow-text";
    case MessageType.ZONE_ANNOUNCEMENT:
    case MessageType.RESURRECTION:
    case MessageType.PARTY_INVITE:
    case MessageType.GUILD_INVITE:
      return "yellow-text";
    case MessageType.FRIEND_STATUS:
    case MessageType.SYSTEM_ERROR:
      return "gray-text";
    case MessageType.COMBAT_SPECIAL:
      return "blue-text";
    default:
      return "white-text";
  }
};

const ChatBox: React.FC = () => {
  const { messages } = useChatStore();
  const chatContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ChatContainer>
      <ChatContent ref={chatContentRef}>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            className={getMessageClass(message.type)}
          >
            {message.text}
          </ChatMessage>
        ))}
      </ChatContent>
    </ChatContainer>
  );
};

export default ChatBox;
