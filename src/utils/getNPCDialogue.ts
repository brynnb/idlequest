import useDialogueStore from "@stores/DialogueStore";
import {
  WorldSocket,
  OpCodes,
  DialogueHistoryEntry,
  GetNPCDialogueRequest,
  GetNPCDialogueResponse,
} from "@/net";
import * as $ from "capnp-es";

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

    // Build dialogue history for the request
    const historyForRequest = dialogueHistory.map((entry) => ({
      npcDialogue: entry.npcDialogue || "",
      playerQuestion: entry.playerQuestion || "",
    }));

    const response = await WorldSocket.sendRequest(
      OpCodes.GetNPCDialogueRequest,
      OpCodes.GetNPCDialogueResponse,
      GetNPCDialogueRequest,
      GetNPCDialogueResponse,
      { npcName },
      10000,
      (root: GetNPCDialogueRequest) => {
        // dialogueHistory is a composite list; it must be allocated and populated as a Cap'n Proto list.
        const list = $.utils.initList(
          1,
          GetNPCDialogueRequest._DialogueHistory,
          historyForRequest.length,
          root
        ) as $.List<DialogueHistoryEntry>;

        for (let i = 0; i < historyForRequest.length; i++) {
          const item = list.get(i) as DialogueHistoryEntry;
          item.npcDialogue = historyForRequest[i].npcDialogue;
          item.playerQuestion = historyForRequest[i].playerQuestion;
        }

        root.dialogueHistory = list;
      }
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
