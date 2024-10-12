import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export enum MessageType {
  SYSTEM = "SYSTEM",
  COMBAT_OUTGOING = "COMBAT_OUTGOING",
  COMBAT_INCOMING = "COMBAT_INCOMING",
  EMOTE = "EMOTE",
  SPELL_CAST = "SPELL_CAST",
  LOCAL_CHAT = "LOCAL_CHAT",
  SHOUT = "SHOUT",
  OOC = "OOC",
  WHO_LOOKUP = "WHO_LOOKUP",
  PRIVATE_MESSAGE = "PRIVATE_MESSAGE",
  GROUP_CHAT = "GROUP_CHAT",
  EXPERIENCE_GAIN = "EXPERIENCE_GAIN",
  SCREENSHOT = "SCREENSHOT",
  LOOT = "LOOT",
  TRADE = "TRADE",
  AUCTION = "AUCTION",
  GUILD_CHAT = "GUILD_CHAT",
  RAID_CHAT = "RAID_CHAT",
  SKILL_INCREASE = "SKILL_INCREASE",
  QUEST_UPDATE = "QUEST_UPDATE",
  ACHIEVEMENT = "ACHIEVEMENT",
  FACTION_CHANGE = "FACTION_CHANGE",
  ZONE_ANNOUNCEMENT = "ZONE_ANNOUNCEMENT",
  DEATH = "DEATH",
  RESURRECTION = "RESURRECTION",
  PARTY_INVITE = "PARTY_INVITE",
  GUILD_INVITE = "GUILD_INVITE",
  FRIEND_STATUS = "FRIEND_STATUS",
  SYSTEM_ERROR = "SYSTEM_ERROR",
  COMBAT_SPECIAL = "COMBAT_SPECIAL",
}

interface ChatMessage {
  id: number;
  text: string;
  timestamp: number;
  type: MessageType;
}

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (text: string, type: MessageType) => void;
  clearMessages: () => void;
}

const initialMessages: ChatMessage[] = [
  { id: 1, text: "Welcome to IdleQuest!", timestamp: Date.now() - 5000, type: MessageType.SYSTEM },
];

const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set) => ({
        messages: initialMessages,
        addMessage: (text: string, type: MessageType) =>
          set((state) => ({
            messages: [
              ...state.messages,
              { id: Date.now(), text, timestamp: Date.now(), type },
            ].slice(-100), // Keep only the last 100 messages
          })),
        clearMessages: () => set({ messages: [] }),
      }),
      { name: "chat-storage" }
    ),
    { name: "Chat Store" }
  )
);

export default useChatStore;
