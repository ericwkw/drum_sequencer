
import { GoogleGenAI, Type } from "@google/genai";
import { GridPattern } from "../types";

const getSystemInstruction = (steps: number) => `
You are a professional drum machine sequencer expert. 
You will receive a description of a drum beat.
You must output a JSON object representing a ${steps}-step grid for standard drum instruments:
Kick, Snare, Hi-Hat, Clap, Open Hat, High Tom, Low Tom, Crash, Ride.

The grid should be a flat array of booleans for each instrument used, length ${steps}.
`;

export const generatePatternWithGemini = async (
  prompt: string, 
  currentBpm: number,
  steps: number
): Promise<{ 
    grid: Record<string, boolean[]>; // Changed to map instrumentID -> pattern
    bpm: number 
}> => {
  
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
            kickPattern: { type: Type.ARRAY, items: { type: Type.BOOLEAN } },
            snarePattern: { type: Type.ARRAY, items: { type: Type.BOOLEAN } },
            hihatPattern: { type: Type.ARRAY, items: { type: Type.BOOLEAN } },
            clapPattern: { type: Type.ARRAY, items: { type: Type.BOOLEAN } },
            openhatPattern: { type: Type.ARRAY, items: { type: Type.BOOLEAN } },
            tomHighPattern: { type: Type.ARRAY, items: { type: Type.BOOLEAN } },
            tomLowPattern: { type: Type.ARRAY, items: { type: Type.BOOLEAN } },
            crashPattern: { type: Type.ARRAY, items: { type: Type.BOOLEAN } },
            ridePattern: { type: Type.ARRAY, items: { type: Type.BOOLEAN } },
          },
          required: ["suggestedBpm", "kickPattern", "snarePattern", "hihatPattern"],
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

    const patterns: Record<string, boolean[]> = {
        'kick': ensureSteps(data.kickPattern),
        'snare': ensureSteps(data.snarePattern),
        'hihat': ensureSteps(data.hihatPattern),
        'clap': ensureSteps(data.clapPattern),
        'openhat': ensureSteps(data.openhatPattern),
        'tom_high': ensureSteps(data.tomHighPattern),
        'tom_low': ensureSteps(data.tomLowPattern),
        'crash': ensureSteps(data.crashPattern),
        'ride': ensureSteps(data.ridePattern),
    };

    return {
      grid: patterns,
      bpm: data.suggestedBpm || currentBpm,
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
