import { create } from 'zustand';

interface DialogueState {
  currentDialogue: string | null;
  setCurrentDialogue: (dialogue: string | null) => void;
}

const useDialogueStore = create<DialogueState>((set) => ({
  currentDialogue: null,
  setCurrentDialogue: (dialogue) => set({ currentDialogue: dialogue }),
}));

export default useDialogueStore;
