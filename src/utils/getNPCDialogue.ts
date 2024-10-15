import { getDatabase } from './databaseOperations';
import OpenAI from 'openai';
import useDialogueStore from '@stores/DialogueStore';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY || window.env?.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.error('OpenAI API key is missing. Please check your environment variables.');
}

const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
});

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

export async function getNPCDialogue(npcName: string, dialogueHistory: DialogueEntry[] = []): Promise<DialogueResponse | NonDialogueResponse | null> {
  const { setIsLoading } = useDialogueStore.getState();
  setIsLoading(true);

  console.log(`getNPCDialogue called with npcName: ${npcName}`);

  console.log('Getting database...');
  const db = getDatabase();
  if (!db) {
    console.error('Database not initialized');
    throw new Error("Database not initialized");
  }
  console.log('Database retrieved successfully');

  let luaScript = '';
  let messages: OpenAI.Chat.ChatCompletionMessageParam[];

  try {
    console.log(`Executing SQL query for NPC: ${npcName}`);
    const result = db.exec(`
      SELECT lua_content
      FROM quests
      WHERE name = ?
      LIMIT 1
    `, [npcName]);

    const nonDialogueInstruction = "You are an AI assistant creating dialogue for NPCs in a fantasy MMORPG setting, EverQuest. " +
          "Generate a brief, context-appropriate response for an NPC when approached by a player. " +
          "The player is interacting with this NPC despite the NPC not having any dialogue for the player, often because it's a non-speaking creature like an animal. Simply describe what the NPC is doing in response to being talked at, but do not give it any speaking lines. For example, the NPC might look at the player and walk away. Or ignore them entirely." +
          "Format your response as a JSON object with 'dialogue' property. "

          const sharedInstruction = "Do not make up details about an NPC's species if you do not know.  No not make up details about an NPC's species if you do not know (e.g. don't make the NPC a unicorn unless it's obvious from the name). Do not make inanimate objects act like they're alive (they don't look at things). Things like boats may have dialogue associated in the LUA script but still do not treat them like they can speak. SirensBane and Stormbreaker are ships, do not make them talk or look at things. Do not refer to 'the player' and instead say 'you' ";

    console.log('SQL query executed. Result:', JSON.stringify(result, null, 2));

    if (result.length > 0 && result[0].values.length > 0) {
      luaScript = result[0].values[0][0] as string;
      messages = [
        { role: "system", content: "You are an AI assistant that analyzes Lua scripts for NPCs from the 1999 MMORPG EverQuest. " +
          "Extract the dialogue from the NPC script and provide one to three responses for the user to choose from " +
          "to further progress the dialogue. Only provide multiple responses if there are multiple areas for the " +
          "conversation to progress to. Only present the opening dialogue from the script. Format your response as " +
          "a JSON object with 'dialogue' and 'responses' fields. If the LUA script has no dialogue and is only event scripting, then " +
          nonDialogueInstruction + sharedInstruction },
        { role: "user", content: `NPC named ${npcName} and LUA script:\n\n${luaScript}` }
      ];
    } else {
      console.log(`No Lua script found for NPC: ${npcName}`);
      messages = [
        { role: "system", content: nonDialogueInstruction + sharedInstruction },
        { role: "user", content: `Create a description of the actions of an NPC named ${npcName} when approached by a player. ` +
          `No specific script is available, so use your knowledge of EverQuest to create an appropriate response. ` }
      ];
    }

    if (dialogueHistory.length > 0) {
      const historyContent = dialogueHistory.map(entry => 
        `${entry.npcDialogue}${entry.playerQuestion ? `\nPlayer: ${entry.playerQuestion}` : ''}`
      ).join('\n');
      messages.push({ role: "user", content: `Previous dialogue:\n${historyContent}\n\nContinue the conversation based on this context.` });
    }

    try {
      const completion = await openai.chat.completions.create({
        // model: "gpt-4-0125-preview",
        // model: "gpt-3.5-turbo",
        // model: "gpt-4o",
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: messages,
      });

      const response: DialogueResponse | NonDialogueResponse = JSON.parse(completion.choices[0].message.content || '{}');
      console.log('Dialogue response:', response);
      
      if ('responses' in response) {
        return response as DialogueResponse;
      } else {
        return response as NonDialogueResponse;
      }
    } catch (error) {
      console.error("Error in OpenAI API call:", error);
      return null;
    }
  } catch (error) {
    console.error("Error in getNPCDialogue:", error);
    return null;
  } finally {
    setIsLoading(false);
  }
}
