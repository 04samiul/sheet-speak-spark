// Gemini API service — generates vocabulary data for a given English word
import { GEMINI_API_KEY } from "./config";

export interface VocabData {
  word: string;
  banglaMeaning: string;
  sentence: string;
  synonym: string;
  antonym: string;
}

function getGeminiErrorMessage(status: number, responseText: string): string {
  let parsed:
    | {
        error?: {
          message?: string;
          details?: Array<{ retryDelay?: string }>;
        };
      }
    | null = null;

  try {
    parsed = JSON.parse(responseText) as {
      error?: {
        message?: string;
        details?: Array<{ retryDelay?: string }>;
      };
    };
  } catch {
    parsed = null;
  }

  const retryDelay = parsed?.error?.details?.find((detail) => detail.retryDelay)?.retryDelay;
  const apiMessage = parsed?.error?.message?.trim() || responseText.trim() || "Unknown Gemini error";

  if (status === 429) {
    return `Gemini quota is exhausted or not enabled for this API key.${retryDelay ? ` Retry after ${retryDelay}.` : ""} Enable Gemini API usage for this Google project, then try again.`;
  }

  if (status === 403) {
    return "This Gemini API key does not have permission to use the model. Make sure Gemini API access is enabled for the same Google project.";
  }

  if (status === 400 && /api key/i.test(apiMessage)) {
    return "The Gemini API key is invalid. Double-check the key in src/lib/config.ts.";
  }

  return `Gemini API error (${status}): ${apiMessage}`;
}

/**
 * Calls Google Gemini API to generate vocabulary details for a word.
 * Checks UK English spelling and generates Bengali meaning, sentence, synonym, antonym.
 */
export async function generateVocabData(word: string): Promise<VocabData> {
  const prompt = `You are a vocabulary assistant. Given the English word "${word}", do the following:
1. First, verify if the word uses correct UK English spelling. If not, correct it to UK English.
2. Provide the Bengali (Bangla) meaning of the word.
3. Write one clear English sentence using the word.
4. Give one synonym.
5. Give one antonym.

Respond ONLY in this exact JSON format (no markdown, no code blocks):
{
  "word": "the UK English spelling of the word",
  "banglaMeaning": "Bengali meaning here",
  "sentence": "An example sentence using the word.",
  "synonym": "a synonym",
  "antonym": "an antonym"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(getGeminiErrorMessage(response.status, errorText));
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Gemini API");
  }

  // Parse the JSON response — strip any markdown fences if present
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned) as VocabData;
  } catch {
    throw new Error(`Failed to parse Gemini response: ${cleaned}`);
  }
}
