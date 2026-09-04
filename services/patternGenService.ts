import { InstrumentType } from "../types";
import { normalizeRow } from "./patternUtils";

// Provider is config-driven: any OpenAI-compatible chat-completions endpoint.
// Defaults to OpenRouter with a free GLM model. Override with LLM_BASE_URL /
// LLM_MODEL in .env — e.g. point it at Gemini's OpenAI-compatible endpoint
// with no code change. The call is client-side, so whatever key you use
// ships in the bundle — keep it a free / low-limit key.
const LLM_BASE_URL = (process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/+$/, "");
const LLM_MODEL = process.env.LLM_MODEL || "z-ai/glm-5.2:free";
const LLM_ENDPOINT = `${LLM_BASE_URL}/chat/completions`;
const IS_OPENROUTER = /(^|\.)openrouter\.ai/i.test(LLM_BASE_URL);

const getSystemInstruction = (steps: number) => `
You are a professional drum machine sequencer expert.
You will receive a description of a drum beat.
You must output a JSON object representing a ${steps}-step grid for standard drum instruments:
Kick, Snare, Hi-Hat, Open Hat, Clap, High Tom, Low Tom, Crash, Ride.

Respond with a single JSON object and nothing else (no markdown, no code fences):
{
  "suggestedBpm": <number>,
  "kickPattern": [<${steps} booleans>],
  "snarePattern": [<${steps} booleans>],
  "hihatPattern": [<${steps} booleans>],
  "openhatPattern": [<${steps} booleans>],
  "clapPattern": [<${steps} booleans>],
  "tomHighPattern": [<${steps} booleans>],
  "tomLowPattern": [<${steps} booleans>],
  "crashPattern": [<${steps} booleans>],
  "ridePattern": [<${steps} booleans>]
}

Each array must have exactly ${steps} booleans. Sync open hats with kicks where it
makes musical sense, and pick tempos appropriate to the requested genre.
`;

const callLlm = async (apiKey: string, prompt: string, steps: number): Promise<string> => {
  const res = await fetch(LLM_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // OpenRouter attribution headers only — other providers (e.g. Gemini's
      // OpenAI-compatible endpoint) reject unknown headers at CORS preflight.
      ...(IS_OPENROUTER && typeof location !== "undefined"
        ? { "HTTP-Referer": location.origin, "X-Title": "BeatMe" }
        : {}),
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: getSystemInstruction(steps) },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM request failed: ${res.status} ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  const msg = data?.choices?.[0]?.message;
  // Some reasoning models put the answer in `content`, thinking in `reasoning`.
  return msg?.content || msg?.reasoning || "";
};

const extractJson = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned;
};

// Rejects output that parsed but isn't a usable pattern: at least one
// instrument array present, and every array present is actually an array
// of the right rough shape (not e.g. a string or an object).
const isUsablePattern = (data: any, steps: number): boolean => {
  if (!data || typeof data !== 'object') return false;
  const keys = ['kickPattern', 'snarePattern', 'hihatPattern', 'openhatPattern', 'clapPattern',
    'tomHighPattern', 'tomLowPattern', 'crashPattern', 'ridePattern'];
  let hasAny = false;
  for (const key of keys) {
    const val = data[key];
    if (val === undefined) continue;
    if (!Array.isArray(val)) return false;
    hasAny = true;
  }
  return hasAny && (typeof data.suggestedBpm === 'number' || data.suggestedBpm === undefined);
};

// Deterministic, offline pattern used when no API key is configured or every
// LLM attempt fails — the feature degrades instead of doing nothing.
const getOfflinePattern = (steps: number): Record<InstrumentType, boolean[]> => {
  // A generic 16-step reference groove, scaled to whatever step count is active.
  const reference: Record<InstrumentType, boolean[]> = {
    kick:     [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
    snare:    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hihat:    [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    openhat:  [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
    clap:     [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    tom_high: Array(16).fill(false),
    tom_low:  Array(16).fill(false),
    crash:    [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    ride:     Array(16).fill(false),
  };
  const scale = (row: boolean[]) => Array.from({ length: steps }, (_, i) => row[Math.floor((i / steps) * 16)]);
  return {
    kick: scale(reference.kick),
    snare: scale(reference.snare),
    hihat: scale(reference.hihat),
    openhat: scale(reference.openhat),
    clap: scale(reference.clap),
    tom_high: scale(reference.tom_high),
    tom_low: scale(reference.tom_low),
    crash: scale(reference.crash),
    ride: scale(reference.ride),
  };
};

export const generatePattern = async (
  prompt: string,
  currentBpm: number,
  steps: number,
): Promise<{
  grid: Record<string, boolean[]>;
  bpm: number;
  offline: boolean;
}> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("No LLM API key set — using the offline pattern generator");
    return { grid: getOfflinePattern(steps), bpm: currentBpm, offline: true };
  }

  const userPrompt = `Generate a ${steps}-step drum pattern for: ${prompt}. Current tempo is ${currentBpm} BPM unless the description implies otherwise.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const nudge = attempt === 0 ? "" :
      '\n\nYour previous reply was not valid JSON matching the required shape. ' +
      'Return ONLY the JSON object described in the system instructions.';
    try {
      const raw = await callLlm(apiKey, userPrompt + nudge, steps);
      const data = JSON.parse(extractJson(raw));
      if (isUsablePattern(data, steps)) {
        const patterns: Record<string, boolean[]> = {
          kick: normalizeRow(data.kickPattern, steps),
          snare: normalizeRow(data.snarePattern, steps),
          hihat: normalizeRow(data.hihatPattern, steps),
          clap: normalizeRow(data.clapPattern, steps),
          openhat: normalizeRow(data.openhatPattern, steps),
          tom_high: normalizeRow(data.tomHighPattern, steps),
          tom_low: normalizeRow(data.tomLowPattern, steps),
          crash: normalizeRow(data.crashPattern, steps),
          ride: normalizeRow(data.ridePattern, steps),
        };
        return { grid: patterns, bpm: data.suggestedBpm || currentBpm, offline: false };
      }
      console.warn(`AI output failed validation (attempt ${attempt + 1})`);
    } catch (error) {
      console.error(`LLM generation attempt ${attempt + 1} failed`, error);
      if (attempt === 1) throw error;
    }
  }

  throw new Error("AI failed to produce a usable pattern after retrying");
};
