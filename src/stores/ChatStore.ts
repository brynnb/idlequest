import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  WorldSocket,
  OpCodes,
  SendChatMessageRequest,
  ChatMessageCapnp,
} from "@/net";

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
            // Send chat message via Cap'n Proto
            await WorldSocket.sendMessage(
              OpCodes.SendChatMessage,
              SendChatMessageRequest,
              {
                text,
                messageType,
              }
            );

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

            // Register handler for incoming chat messages via Cap'n Proto
            WorldSocket.registerOpCodeHandler(
              OpCodes.ChatMessageBroadcast,
              ChatMessageCapnp,
              (message) => {
                get().addMessage(
                  message.text,
                  mapMessageType(message.messageType)
                );
              }
            );

            // WorldSocket connection is managed elsewhere (during login flow)
            // Just check if already connected
            if (WorldSocket.isConnected) {
              set({ isConnected: true, connectionError: null });
              // Load static data from server
              import("./StaticDataStore").then((module) => {
                module.default.getState().loadStaticData();
              });
            } else {
              console.log("WorldSocket not connected");
              set({
                isConnected: false,
                connectionError: null,
              });
            }
          } catch (error) {
            console.error("Failed to initialize chat:", error);
            set({
              isConnected: false,
              connectionError: `Chat initialization failed: ${error}`,
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
