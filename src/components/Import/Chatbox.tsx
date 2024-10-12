import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import useChatStore, { MessageType } from "../../stores/ChatStore";
import VerticalScroll from "../Interface/VerticalScroll";

const ChatContainer = styled.div.attrs({ className: "chat-container" })`
  width: 801px;
  height: 308px;
  overflow-y: auto;
  left: 267px;
  top: 722px;
  position: absolute;
  background-image: url("/images/chatbg.png");
  background-size: cover;
  padding-left: 100px;
  padding-top: 50px;
  font-size: 20px;
  line-height: 1.2;

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

  .white-text {
    color: #ffffff;
  }

  .gray-text {
    color: #808080;
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
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ChatContainer>
      {messages.map((message) => (
        <ChatMessage key={message.id} className={getMessageClass(message.type)}>
          {message.text}
        </ChatMessage>
      ))}
      <div ref={chatEndRef} />
      <VerticalScroll contentHeight={100} onScroll={() => {}} />
    </ChatContainer>
  );
};

export default ChatBox;
