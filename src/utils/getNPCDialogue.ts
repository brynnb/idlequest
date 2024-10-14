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

interface DialogueResponse {
  dialogue: string;
  questions: string[];
}

interface NonDialogueResponse {
  dialogue: string;
}

export async function getNPCDialogue(npcName: string): Promise<DialogueResponse | NonDialogueResponse | null> {
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
          "The player is interactign with this NPC despite the NPC not having any dialogue for the player, often because it's a non-speaking creature like an animal. Simply describe what the NPC is doing in response to being talked at, but do not give it any speaking lines. For example, the NPC might look at the player and walk away. Or ignore them entirely." +
          "Format your response as a JSON object with 'dialogue' property. " ;

    console.log('SQL query executed. Result:', JSON.stringify(result, null, 2));

    if (result.length > 0 && result[0].values.length > 0) {
      luaScript = result[0].values[0][0] as string;
      messages = [
        { role: "system", content: "You are an AI assistant that analyzes Lua scripts for NPCs from the 1999 MMORPG EverQuest. " +
          "Extract the dialogue from the NPC script and provide one to three questions for the user to respond with " +
          "to further progress the dialogue. Only provide multiple questions if there are multiple areas for the " +
          "conversation to progress to. Only present the opening dialogue from the script. Format your response as " +
          "a JSON object with 'dialogue' and 'questions' fields. If the LUA script has no dialogue and is only event scripting, then " +
          nonDialogueInstruction },
        { role: "user", content: `NPC named ${npcName} and LUA script:\n\n${luaScript}` }
      ];
    } else {
      console.log(`No Lua script found for NPC: ${npcName}`);
      messages = [
        { role: "system", content: nonDialogueInstruction },
        { role: "user", content: `Create a description of the actions of an NPCnamed ${npcName} when approached by a player. ` +
          `No specific script is available, so use your knowledge of fantasy RPGs and EverQuest to create an appropriate response.` }
      ];
    }

  
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: messages,
      });

      const response: DialogueResponse | NonDialogueResponse = JSON.parse(completion.choices[0].message.content || '{}');
      console.log('Dialogue response:', response);
      
      if ('questions' in response) {
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
  }
}
