import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY is not set');
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
}

const METADATA_SYSTEM = `You are a memecoin token namer. Given a short concept or theme, output ONLY valid JSON with exactly these keys (no markdown, no code block):
- "name": A catchy token name (2-4 words max, title case). No generic AI slop like "SuperDoge" or "MoonRocket".
- "symbol": Ticker, 2-8 uppercase letters, no spaces.
- "description": One or two punchy sentences for the token description. Memecoin vibe, not corporate.`;

export async function generateTokenMetadata(prompt: string): Promise<TokenMetadata> {
  const ai = getClient();
  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: `${METADATA_SYSTEM}\n\nConcept: ${prompt}` }],
      },
    ],
  });

  const text = res.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned) as TokenMetadata;
  if (!parsed.name || !parsed.symbol) throw new Error('Invalid metadata: missing name or symbol');
  return {
    name: String(parsed.name).trim(),
    symbol: String(parsed.symbol).trim().toUpperCase().slice(0, 10),
    description: String(parsed.description ?? '').trim(),
  };
}

const IMAGE_STYLE_RULES = `CRITICAL RULES:
- Square 1:1 composition. Token avatar / profile picture style.
- Single bold subject centered. Vector mascot or logo-style illustration, clean lines, vibrant colors.
- Dark or solid background so it pops on listing sites.
- NO text, NO watermarks, NO borders, NO gradient blobs, NO generic clipart.
- NOT photorealistic. Stylized, memorable, the kind of icon that works as a token logo.`;

export async function generateTokenImage(
  prompt: string,
  tokenName: string,
  referenceImage?: { base64: string; mimeType: string },
): Promise<Buffer> {
  const ai = getClient();
  const imagePrompt = `${IMAGE_STYLE_RULES}

Generate a token logo / avatar for: "${tokenName}".

Visual concept: ${prompt}

Output: One square image, mascot/avatar style, centered, bold, no text.`;

  const parts: { text?: string; inlineData?: { data: string; mimeType: string } }[] = [];
  if (referenceImage) {
    parts.push({
      inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType },
    });
    parts.push({
      text: `Use this image as visual reference. Do not copy it exactly — turn it into a clean token logo following the rules below. Same subject/style, simplified and stylized.\n\n${imagePrompt}`,
    });
  } else {
    parts.push({ text: imagePrompt });
  }

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts }],
    config: {
      responseModalities: ['Text', 'Image'],
    },
  });

  const responseParts = res.candidates?.[0]?.content?.parts ?? [];
  for (const part of responseParts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, 'base64');
    }
  }
  throw new Error('No image data in response');
}
