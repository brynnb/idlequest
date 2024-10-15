import { create } from 'zustand';
import { DialogueResponse, NonDialogueResponse } from '@utils/getNPCDialogue';

interface DialogueEntry {
  npcDialogue: string;
  playerQuestion?: string;
}

interface DialogueState {
  dialogueHistory: Record<string, DialogueEntry[]>;
  currentNPC: string | null;
  currentDialogue: DialogueResponse | NonDialogueResponse | null;
  setCurrentDialogue: (dialogue: DialogueResponse | NonDialogueResponse | null) => void;
  setCurrentNPC: (npcName: string) => void;
  addDialogueEntry: (npcName: string, entry: DialogueEntry) => void;
  getDialogueHistory: (npcName: string) => DialogueEntry[];
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const useDialogueStore = create<DialogueState>((set, get) => ({
  dialogueHistory: {},
  currentNPC: null,
  currentDialogue: null,
  setCurrentDialogue: (dialogue) => set({ currentDialogue: dialogue }),
  setCurrentNPC: (npcName) => set({ currentNPC: npcName }),
  addDialogueEntry: (npcName, entry) => set((state) => ({
    dialogueHistory: {
      ...state.dialogueHistory,
      [npcName]: [...(state.dialogueHistory[npcName] || []), entry],
    },
  })),
  getDialogueHistory: (npcName) => get().dialogueHistory[npcName] || [],
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));

export default useDialogueStore;
