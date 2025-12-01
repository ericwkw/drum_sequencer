import { GoogleGenAI, Type } from "@google/genai";
import { GridPattern, InstrumentType } from "../types";
import { STEPS, createEmptyGrid, INSTRUMENTS } from "../constants";

const getSystemInstruction = () => `
You are a professional drum machine sequencer expert. 
You will receive a description of a drum beat (e.g., "fast techno", "slow hip hop", "jungle").
You must output a JSON object representing a 16-step grid for 4 instruments in this specific order:
1. Kick
2. Snare
3. Hi-Hat
4. Clap

The grid should be a flat array of booleans for each instrument, length 16.
`;

export const generatePatternWithGemini = async (
  prompt: string, 
  currentBpm: number
): Promise<{ grid: GridPattern; bpm: number }> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a drum pattern for: ${prompt}. Ideally suggests a BPM suitable for this style.`,
      config: {
        systemInstruction: getSystemInstruction(),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedBpm: {
              type: Type.NUMBER,
              description: "The recommended BPM for this genre.",
            },
            kickPattern: {
              type: Type.ARRAY,
              items: { type: Type.BOOLEAN },
              description: "16 steps for Kick",
            },
            snarePattern: {
              type: Type.ARRAY,
              items: { type: Type.BOOLEAN },
              description: "16 steps for Snare",
            },
            hihatPattern: {
              type: Type.ARRAY,
              items: { type: Type.BOOLEAN },
              description: "16 steps for Hi-Hat",
            },
            clapPattern: {
              type: Type.ARRAY,
              items: { type: Type.BOOLEAN },
              description: "16 steps for Clap",
            },
          },
          required: ["suggestedBpm", "kickPattern", "snarePattern", "hihatPattern", "clapPattern"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);

    // Validate lengths
    const ensure16 = (arr: boolean[]) => {
      if (arr.length >= STEPS) return arr.slice(0, STEPS);
      return [...arr, ...Array(STEPS - arr.length).fill(false)];
    };

    const newGrid: GridPattern = [
      ensure16(data.kickPattern || []),
      ensure16(data.snarePattern || []),
      ensure16(data.hihatPattern || []),
      ensure16(data.clapPattern || []),
    ];

    return {
      grid: newGrid,
      bpm: data.suggestedBpm || currentBpm,
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Return empty fallback on error
    return { grid: createEmptyGrid(), bpm: currentBpm };
  }
};
