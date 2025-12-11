import useDialogueStore from "@stores/DialogueStore";
import {
  WorldSocket,
  OpCodes,
  GetNPCDialogueRequest,
  GetNPCDialogueResponse,
} from "@/net";

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
    if (!WorldSocket.isConnected) {
      console.warn("WorldSocket not connected for getNPCDialogue");
      return null;
    }

    // Note: Cap'n Proto lists need special handling - for now we send without history
    // A full implementation would need to build the list properly
    const response = await WorldSocket.sendRequest(
      OpCodes.GetNPCDialogueRequest,
      OpCodes.GetNPCDialogueResponse,
      GetNPCDialogueRequest,
      GetNPCDialogueResponse,
      { npcName }
    );

    if (!response.success) {
      console.error("Failed to fetch dialogue:", response.error);
      return null;
    }

    console.log("Dialogue response:", response);

    // Convert Cap'n Proto list to array
    const responses: string[] = [];
    for (let i = 0; i < response.responses.length; i++) {
      responses.push(response.responses.get(i));
    }

    return {
      dialogue: response.dialogue || "",
      responses: responses,
    };
  } catch (error) {
    console.error("Error in getNPCDialogue:", error);
    return null;
  } finally {
    setIsLoading(false);
  }
}
