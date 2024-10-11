import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface ChatMessage {
  id: number;
  text: string;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (text: string) => void;
  clearMessages: () => void;
}

const initialMessages: ChatMessage[] = [
  { id: 1, text: "Hello, welcome to the chat!", timestamp: Date.now() - 5000 },
  { id: 2, text: "How's everyone doing today?", timestamp: Date.now() - 4000 },
  { id: 3, text: "I'm excited to be here!", timestamp: Date.now() - 3000 },
  { id: 4, text: "Does anyone have plans for the weekend?", timestamp: Date.now() - 2000 },
  { id: 5, text: "I heard there's a new movie coming out.", timestamp: Date.now() - 1000 },
];

const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set) => ({
        messages: initialMessages,
        addMessage: (text: string) =>
          set((state) => ({
            messages: [
              ...state.messages,
              { id: Date.now(), text, timestamp: Date.now() },
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