import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json());

// Initialize Google GenAI on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Server-side Gemini API endpoint for answering WW1 and general web inquiries
app.post('/api/gemini/ask', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A valid message string is required.' });
    }

    const systemInstruction = `You are the Somme Tactical Historian & WW1 Intelligence Officer, an authoritative, engaging, and historically rigorous educator.
You answer any question asked by the user — from specific Battle of the Somme tactics, trench conditions, weapons (Lewis gun, MG 08, Livens Flame Projector), commanders (Sir Douglas Haig, Rawlinson, Falkenhayn), and everyday soldier life (rats, bully beef, trench foot), to broader First World War queries and general web inquiries.
Tone & Style:
- Vivid, clear, and direct. Suitable for curious Year 9 students through military history enthusiasts.
- Grounded in authentic historical facts and military realities.
- If the question is about non-WW1 subjects or broader knowledge, answer it accurately and thoroughly using your search capabilities while retaining your sharp, insightful demeanor.
- Provide concise paragraphs with bullet points for readability when explaining complex maneuvers or multi-part questions.`;

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.role === 'user' || item.role === 'model') {
          contents.push({
            role: item.role,
            parts: [{ text: String(item.text || item.content || '') }],
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    // Generate content using gemini-3.8-flash with Google Search grounding, falling back to ungrounded if search quota is exceeded
    let response;
    let usedSearch = true;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });
    } catch (searchError: any) {
      console.warn('Search-grounded generation encountered an error, falling back to core knowledge base:', searchError?.message);
      usedSearch = false;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
          },
        });
      } catch (fallbackError: any) {
        throw fallbackError;
      }
    }

    const answer = response?.text || 'No response recorded by field intelligence.';

    // Extract search grounding web sources if present
    const rawChunks = usedSearch ? (response?.candidates?.[0]?.groundingMetadata?.groundingChunks || []) : [];
    const sources = rawChunks
      .map((c: any) => c.web)
      .filter((w: any) => Boolean(w && (w.uri || w.title)))
      .map((w: any) => ({
        title: w.title || w.uri,
        uri: w.uri,
      }))
      .filter((src: any, index: number, self: any[]) => 
        index === self.findIndex((s) => s.uri === src.uri)
      );

    return res.json({
      answer,
      sources,
    });
  } catch (error: any) {
    console.error('Gemini query error:', error);
    const msg = error?.message || '';
    let userMessage = 'Trench telegraph issue: Failed to reach the Gemini historian. Please try again.';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      userMessage = 'Trench communication channel is momentarily congested (API rate quota exceeded). Please wait a few moments and try again.';
    } else if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
      userMessage = 'Field authorization error: Insufficient permissions or invalid API credentials.';
    }
    return res.status(500).json({
      error: userMessage,
    });
  }
});

// Mount Vite middleware in development or static dist in production
if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
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

app.listen(port, '0.0.0.0', () => {
  console.log(`Battlefield server listening on port ${port}`);
});
