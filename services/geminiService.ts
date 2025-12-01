import { GoogleGenAI, Type } from "@google/genai";
import { GridPattern } from "../types";

const getSystemInstruction = (steps: number) => `
You are a professional drum machine sequencer expert. 
You will receive a description of a drum beat.
You must output a JSON object representing a ${steps}-step grid for 4 basic instruments:
1. Kick
2. Snare
3. Hi-Hat
4. Clap

The grid should be a flat array of booleans for each instrument, length ${steps}.
`;

export const generatePatternWithGemini = async (
  prompt: string, 
  currentBpm: number,
  steps: number
): Promise<{ grid: GridPattern; bpm: number }> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a ${steps}-step drum pattern for: ${prompt}.`,
      config: {
        systemInstruction: getSystemInstruction(steps),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedBpm: {
              type: Type.NUMBER,
              description: "The recommended BPM.",
            },
            kickPattern: {
              type: Type.ARRAY,
              items: { type: Type.BOOLEAN },
              description: `Steps for Kick (length ${steps})`,
            },
            snarePattern: {
              type: Type.ARRAY,
              items: { type: Type.BOOLEAN },
              description: `Steps for Snare (length ${steps})`,
            },
            hihatPattern: {
              type: Type.ARRAY,
              items: { type: Type.BOOLEAN },
              description: `Steps for Hi-Hat (length ${steps})`,
            },
            clapPattern: {
              type: Type.ARRAY,
              items: { type: Type.BOOLEAN },
              description: `Steps for Clap (length ${steps})`,
            },
          },
          required: ["suggestedBpm", "kickPattern", "snarePattern", "hihatPattern", "clapPattern"],
        },
      },
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");

    // Clean Markdown
    if (text.startsWith("```")) {
      text = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const data = JSON.parse(text);

    // Helper to ensure exact step count
    const ensureSteps = (arr: boolean[]) => {
      if (!arr) return Array(steps).fill(false);
      if (arr.length >= steps) return arr.slice(0, steps);
      return [...arr, ...Array(steps - arr.length).fill(false)];
    };

    const newGrid: GridPattern = [
      ensureSteps(data.kickPattern),
      ensureSteps(data.snarePattern),
      ensureSteps(data.hihatPattern),
      ensureSteps(data.clapPattern),
    ];

    return {
      grid: newGrid,
      bpm: data.suggestedBpm || currentBpm,
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};