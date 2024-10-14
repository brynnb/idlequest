import { getDatabase } from './databaseOperations';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

console.log('OpenAI client initialized');

export async function getNPCDialogue(npcName: string): Promise<string | null> {
  console.log(`getNPCDialogue called with npcName: ${npcName}`);

  console.log('Getting database...');
  const db = getDatabase();
  if (!db) {
    console.error('Database not initialized');
    throw new Error("Database not initialized");
  }
  console.log('Database retrieved successfully');

  try {
    console.log(`Executing SQL query for NPC: ${npcName}`);
    const result = db.exec(`
      SELECT lua_content
      FROM quests
      WHERE name = ?
      LIMIT 1
    `, [npcName]);

    console.log('SQL query executed. Result:', JSON.stringify(result, null, 2));

    if (result.length === 0 || result[0].values.length === 0) {
      console.log(`No Lua script found for NPC: ${npcName}`);
      return null;
    }

    const luaScript = result[0].values[0][0] as string;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an AI assistant that analyzes Lua scripts for NPCs from the 1999 MMORPG EverQuest. Extract and the LUA script and roleplay dialogue from the NPC. Provide one to three responses for the user to respond with to further progress the dialogue. One provide more than one response if there are multiple areas for the conversation to progress to. Only present the opening dialogue from the script, and only reveal further dialogue if the user responds with the keyword provided. If the user responds with anything other than the keyword, inform them that they must respond with the keyword to progress the dialogue as the user responds appropriately. Do not provide any other wording or disclaimers other than the dialogue and suggested responses." },
          { role: "user", content: `NPC named ${npcName} and LUA script:\n\n${luaScript}` }
        ],
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("Error in OpenAI API call:", error);
      return null;
    }
  } catch (error) {
    console.error("Error in getNPCDialogue:", error);
    return null;
  }
}
