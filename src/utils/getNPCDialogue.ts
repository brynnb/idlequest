import useDialogueStore from '@stores/DialogueStore';

export interface DialogueResponse {
  dialogue: string;
  responses: string[];
}

export interface NonDialogueResponse {
  dialogue: string;
}

interface DialogueEntry {
  npcDialogue: string;
  playerQuestion?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function getNPCDialogue(
  npcName: string, 
  dialogueHistory: DialogueEntry[] = []
): Promise<DialogueResponse | NonDialogueResponse | null> {
  const { setIsLoading } = useDialogueStore.getState();
  setIsLoading(true);

  console.log(`getNPCDialogue called with npcName: ${npcName}`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/dialogue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        npcName,
        dialogueHistory,
      }),
    });

    if (!response.ok) {
      console.error('Failed to fetch dialogue:', response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('Dialogue response:', data);
    
    return data;
  } catch (error) {
    console.error('Error in getNPCDialogue:', error);
    return null;
  } finally {
    setIsLoading(false);
  }
}