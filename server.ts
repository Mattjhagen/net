import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // AI Assistant endpoint
  app.post('/api/assistant', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { prompt, datasetMeta, currentRngConfig } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (!apiKey) {
        return res.status(200).json({
          reply: 'Note: GEMINI_API_KEY is not configured in environment. Handled via local intelligent rule parser.',
          isLocalFallback: true,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are an expert AI assistant embedded inside a dual-feature data workspace:
1. Interactive Historical Data Graph (historical time-series plotting, zoom, range filtering, metrics)
2. On-Demand Random Number Generator (integers, floats, gaussian/normal distribution, unique sets, CSV/JSON export)

The user is typing natural language commands or questions.
Current uploaded dataset metadata:
${JSON.stringify(datasetMeta || { hasData: false, message: 'No dataset loaded yet' }, null, 2)}

Current RNG configuration:
${JSON.stringify(currentRngConfig || {}, null, 2)}

Your job is to understand the user's intent, provide an intelligent, crisp response, and return structured actions so the UI can execute them immediately.
Rules:
- If the user asks for historical data manipulation (e.g., "Show me only the last 30 days", "Filter to last 7 days", "Only show AAPL Close and Volume", "Change chart to bar chart", "Show all data", "Zoom into 2024"):
  Set action to "filter_graph". Fill graphAction.
- If the user asks for random numbers (e.g., "Give me 50 random integers between 10 and 100", "Generate 20 floats 0 to 1", "50 unique numbers 1-50", "Simulate normal distribution with mean 50"):
  Set action to "generate_rng". Fill rngAction with execute: true.
- If the user asks for statistical analysis or insights about the current data:
  Set action to "analyze" and provide concise, valuable analytical bullet points in reply and insights.
- If the user asks to switch views ("go to RNG", "open graph", "show random generator"):
  Set action to "switch_tab" with target "graph" or "rng".
- Otherwise set action to "none".

Return ONLY JSON adhering to this schema:
{
  "reply": string,
  "action": "filter_graph" | "generate_rng" | "switch_tab" | "analyze" | "none",
  "tab": "graph" | "rng" | null,
  "graphAction": {
    "relativeDays": number | null,
    "startDate": string | null,
    "endDate": string | null,
    "selectedSeries": string[] | null,
    "chartType": "line" | "scatter" | "bar" | "area" | null,
    "resetZoom": boolean | null
  },
  "rngAction": {
    "count": number | null,
    "min": number | null,
    "max": number | null,
    "type": "integer" | "float" | "gaussian" | null,
    "precision": number | null,
    "gaussianMean": number | null,
    "gaussianStdDev": number | null,
    "unique": boolean | null,
    "execute": boolean
  },
  "insights": string[] | null
}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = aiResponse.text;
      if (!responseText) {
        return res.status(500).json({ error: 'Empty response from AI' });
      }

      const parsed = JSON.parse(responseText);
      return res.json({ success: true, ...parsed });
    } catch (error: any) {
      console.error('Error in /api/assistant:', error);
      return res.status(500).json({
        error: error.message || 'Error processing AI command',
        fallback: true,
      });
    }
  });

  // Setup Vite in development or static serving in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DataPlot & RNG Studio running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
