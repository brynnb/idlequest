import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  webTransportClient,
  ChatMessage as WTChatMessage,
} from "@utils/webTransportClient";

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
  sendMessage: (text: string, messageType?: string) => Promise<void>;
  clearMessages: () => void;
  nextId: number;
  isConnected: boolean;
  connectionError: string | null;
  initializeWebTransport: () => Promise<void>;
}

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    text: "Welcome to IdleQuest!",
    timestamp: Date.now() - 5000,
    type: MessageType.SYSTEM,
  },
];

// Helper function to map WebTransport message types to ChatStore MessageTypes
const mapMessageType = (messageType: string): MessageType => {
  switch (messageType.toLowerCase()) {
    case "say":
    case "local":
      return MessageType.LOCAL_CHAT;
    case "shout":
      return MessageType.SHOUT;
    case "ooc":
      return MessageType.OOC;
    case "tell":
    case "private":
      return MessageType.PRIVATE_MESSAGE;
    case "group":
      return MessageType.GROUP_CHAT;
    case "guild":
      return MessageType.GUILD_CHAT;
    case "raid":
      return MessageType.RAID_CHAT;
    case "emote":
      return MessageType.EMOTE;
    case "system":
      return MessageType.SYSTEM;
    default:
      return MessageType.LOCAL_CHAT;
  }
};

const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        messages: initialMessages,
        nextId: 2,
        isConnected: false,
        connectionError: null,

        addMessage: (text: string, type: MessageType) =>
          set((state) => ({
            messages: [
              ...state.messages,
              { id: state.nextId, text, timestamp: Date.now(), type },
            ].slice(-100), // Keep only the last 100 messages
            nextId: state.nextId + 1,
          })),

        sendMessage: async (text: string, messageType: string = "say") => {
          try {
            await webTransportClient.sendChatMessage(text, messageType);

            // Add our own message to the chat (echo)
            get().addMessage(text, mapMessageType(messageType));
          } catch (error) {
            console.error("Failed to send chat message:", error);
            set({ connectionError: `Failed to send message: ${error}` });
          }
        },

        initializeWebTransport: async () => {
          try {
            set({ connectionError: null });

            // Set up the chat message listener
            const unsubscribe = webTransportClient.onChatMessage(
              (message: WTChatMessage) => {
                get().addMessage(
                  message.text,
                  mapMessageType(message.messageType)
                );
              }
            );

            // Connect to WebTransport
            await webTransportClient.connect();
            set({ isConnected: true, connectionError: null });

            // Store unsubscribe function for cleanup (you might want to handle this elsewhere)
            (get() as any)._unsubscribeChatMessages = unsubscribe;
          } catch (error) {
            console.error("Failed to initialize WebTransport:", error);
            set({
              isConnected: false,
              connectionError: `Connection failed: ${error}`,
            });
          }
        },

        clearMessages: () => set({ messages: [], nextId: 1 }),
      }),
      { name: "chat-storage" }
    ),
    { name: "Chat Store" }
  )
);

export default useChatStore;
