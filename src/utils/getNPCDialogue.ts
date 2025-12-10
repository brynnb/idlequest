import useDialogueStore from "@stores/DialogueStore";
import {
  webTransportClient,
  DialogueEntry as WTDialogueEntry,
} from "./webTransportClient";

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

export async function getNPCDialogue(
  npcName: string,
  dialogueHistory: DialogueEntry[] = []
): Promise<DialogueResponse | NonDialogueResponse | null> {
  const { setIsLoading } = useDialogueStore.getState();
  setIsLoading(true);

  console.log(`getNPCDialogue called with npcName: ${npcName}`);

  try {
    // Convert to WebTransport dialogue entry format
    const wtDialogueHistory: WTDialogueEntry[] = dialogueHistory.map(
      (entry) => ({
        npcDialogue: entry.npcDialogue,
        playerQuestion: entry.playerQuestion,
      })
    );

    const response = await webTransportClient.getNPCDialogue(
      npcName,
      wtDialogueHistory
    );

    if (!response.success) {
      console.error("Failed to fetch dialogue:", response.error);
      return null;
    }

    console.log("Dialogue response:", response);

    return {
      dialogue: response.dialogue || "",
      responses: response.responses || [],
    };
  } catch (error) {
    console.error("Error in getNPCDialogue:", error);
    return null;
  } finally {
    setIsLoading(false);
  }
}
