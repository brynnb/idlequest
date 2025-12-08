import { Router, Request, Response } from 'express';
import dialogueService from '../services/dialogueService.js';
import logger from '../utils/logger.js';

const router = Router();

interface DialogueEntry {
  npcDialogue: string;
  playerQuestion?: string;
}

interface DialogueRequest {
  npcName: string;
  dialogueHistory?: DialogueEntry[];
}

router.post('/dialogue', async (req: Request<{}, {}, DialogueRequest>, res: Response) => {
  try {
    const { npcName, dialogueHistory = [] } = req.body;
    
    if (!npcName) {
      return res.status(400).json({ error: 'NPC name is required' });
    }
    
    logger.info(`Dialogue request for NPC: ${npcName}`);
    
    const response = await dialogueService.getNPCDialogue(npcName, dialogueHistory);
    
    if (!response) {
      return res.status(500).json({ error: 'Failed to generate dialogue' });
    }
    
    res.json(response);
  } catch (error) {
    logger.error('Error in dialogue route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;