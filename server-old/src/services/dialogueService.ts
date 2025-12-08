import OpenAI from 'openai';
import sql from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

let db: sql.Database | null = null;

async function initializeDatabase() {
  if (db) return db;
  
  try {
    const SQL = await sql();
    const dbPath = path.join(__dirname, '../../../../data/db/eq_database.db');
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    logger.info('Dialogue database initialized successfully');
    return db;
  } catch (error) {
    logger.error('Failed to initialize dialogue database:', error);
    throw error;
  }
}

class DialogueService {
  private openai: OpenAI;
  
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is missing. Please set OPENAI_API_KEY in your environment variables.');
    }
    
    this.openai = new OpenAI({ apiKey });
  }
  
  async getNPCDialogue(
    npcName: string, 
    dialogueHistory: DialogueEntry[] = []
  ): Promise<DialogueResponse | NonDialogueResponse | null> {
    logger.info(`Getting dialogue for NPC: ${npcName}`);
    
    const database = await initializeDatabase();
    if (!database) {
      throw new Error('Database not initialized');
    }
    
    let luaScript = '';
    let messages: OpenAI.Chat.ChatCompletionMessageParam[];
    
    try {
      const result = database.exec(`
        SELECT lua_content
        FROM quests
        WHERE name = ?
        LIMIT 1
      `, [npcName]);
      
      const nonDialogueInstruction = "You are an AI assistant creating dialogue for NPCs in a fantasy MMORPG setting, EverQuest. " +
        "Generate a brief, context-appropriate response for an NPC when approached by a player. " +
        "The player is interacting with this NPC despite the NPC not having any dialogue for the player, often because it's a non-speaking creature like an animal. Simply describe what the NPC is doing in response to being talked at, but do not give it any speaking lines. For example, the NPC might look at the player and walk away. Or ignore them entirely." +
        "Format your response as a JSON object with 'dialogue' property. ";
      
      const sharedInstruction = "Do not make up details about an NPC's species if you do not know.  No not make up details about an NPC's species if you do not know (e.g. don't make the NPC a unicorn unless it's obvious from the name). Do not make inanimate objects act like they're alive (they don't look at things). Things like boats may have dialogue associated in the LUA script but still do not treat them like they can speak. SirensBane and Stormbreaker are ships, do not make them talk or look at things. Do not refer to 'the player' and instead say 'you' ";
      
      if (result.length > 0 && result[0].values.length > 0) {
        luaScript = result[0].values[0][0] as string;
        messages = [
          { 
            role: "system", 
            content: "You are an AI assistant that analyzes Lua scripts for NPCs from the 1999 MMORPG EverQuest. " +
              "Extract the dialogue from the NPC script and provide one to three responses for the user to choose from " +
              "to further progress the dialogue. Only provide multiple responses if there are multiple areas for the " +
              "conversation to progress to. Only present the opening dialogue from the script. Format your response as " +
              "a JSON object with 'dialogue' and 'responses' fields. If the LUA script has no dialogue and is only event scripting, then " +
              nonDialogueInstruction + sharedInstruction 
          },
          { 
            role: "user", 
            content: `NPC named ${npcName} and LUA script:\n\n${luaScript}` 
          }
        ];
      } else {
        messages = [
          { 
            role: "system", 
            content: nonDialogueInstruction + sharedInstruction 
          },
          { 
            role: "user", 
            content: `Create a description of the actions of an NPC named ${npcName} when approached by a player. ` +
              `No specific script is available, so use your knowledge of EverQuest to create an appropriate response. ` 
          }
        ];
      }
      
      if (dialogueHistory.length > 0) {
        const historyContent = dialogueHistory.map(entry => 
          `${entry.npcDialogue}${entry.playerQuestion ? `\nPlayer: ${entry.playerQuestion}` : ''}`
        ).join('\n');
        messages.push({ 
          role: "user", 
          content: `Previous dialogue:\n${historyContent}\n\nContinue the conversation based on this context.` 
        });
      }
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: messages,
      });
      
      const response: DialogueResponse | NonDialogueResponse = JSON.parse(
        completion.choices[0].message.content || '{}'
      );
      
      logger.info(`Dialogue response received for ${npcName}`);
      
      if ('responses' in response) {
        return response as DialogueResponse;
      } else {
        return response as NonDialogueResponse;
      }
    } catch (error) {
      logger.error('Error in getNPCDialogue:', error);
      return null;
    }
  }
}

export default new DialogueService();