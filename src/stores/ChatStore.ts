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

const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set) => ({
        messages: [],
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
