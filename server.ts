import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { evaluateSafety } from './server/safetyCheck';
import { analyzeShiftReflection, generatePersonalizedGameContent } from './server/gemini';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'SHIFT — Personalized Perspective-Shifting & Skill-Building Arcade',
      modelActive: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Shift Breakdown Analysis Endpoint
  app.post('/api/shift/breakdown', async (req, res) => {
    try {
      const { situation, memoryContext } = req.body;

      if (!situation || typeof situation !== 'string' || !situation.trim()) {
        res.status(400).json({ error: 'Please provide a description of what is going on.' });
        return;
      }

      // 1. Safety & Crisis check
      const safety = evaluateSafety(situation);
      if (safety.isCrisis) {
        res.json({
          safetyInterruption: true,
          crisisType: safety.crisisType,
          crisisMessage: safety.crisisMessage,
        });
        return;
      }

      // 2. Structured Analysis
      const analysis = await analyzeShiftReflection(situation, memoryContext);

      // Attach substance urge indicators if detected
      res.json({
        safetyInterruption: false,
        isSubstanceUrge: safety.isSubstanceUrge,
        substanceDetails: safety.substanceDetails,
        breakdown: analysis,
      });
    } catch (err: any) {
      console.error('[API /api/shift/breakdown error]:', err);
      res.status(500).json({ error: 'Failed to generate Shift Breakdown', details: err.message });
    }
  });

  // Game Content Personalization Endpoint
  app.post('/api/shift/game-content', async (req, res) => {
    try {
      const { gameId, theme, observation, interpretation, updatedPerspective } = req.body;
      const content = await generatePersonalizedGameContent(
        gameId || 'fact_or_story',
        theme || 'general',
        observation || '',
        interpretation || '',
        updatedPerspective || ''
      );
      res.json({ content });
    } catch (err: any) {
      console.error('[API /api/shift/game-content error]:', err);
      res.status(500).json({ error: 'Failed to generate game content', details: err.message });
    }
  });

  // Vite middleware for development vs static production serve
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SHIFT Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
