import express from 'express';
import { AIService } from '../services/aiService';
import type { AIRequest } from '../../../shared/types/workflow';

const router = express.Router();
const aiService = new AIService();

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
    res.status(500).json({ error: 'Failed to generate workflow' });
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
