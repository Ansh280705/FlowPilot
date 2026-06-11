import express from 'express';
import { AIService } from '../services/aiService';
import { groqKeyPool } from '../services/groqKeyPool';
import type { AIRequest } from '../types/workflow';

const router = express.Router();
const aiService = new AIService();

router.get('/status', (_req, res) => {
  const pool = groqKeyPool.status();
  res.json({
    configured: pool.total > 0,
    keys: pool.total,
    available: pool.available,
    cooling: pool.cooling,
    msUntilAvailable: groqKeyPool.msUntilAvailable(),
  });
});

// Generate workflow from prompt
router.post('/generate-workflow', async (req, res) => {
  try {
    const request: AIRequest = req.body;
    
    if (!request.prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await aiService.generateWorkflow(request);
    res.json(response);
  } catch (error) {
    console.error('Error generating workflow:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate workflow';
    const status = message.includes('rate limit') ? 429 : 500;
    res.status(status).json({ error: message });
  }
});

// Enhance prompt
router.post('/enhance-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Use AI service to enhance prompt
    const enhanced = aiService.enhancePrompt(prompt);
    res.json({ original: prompt, enhanced });
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    res.status(500).json({ error: 'Failed to enhance prompt' });
  }
});

export default router;
