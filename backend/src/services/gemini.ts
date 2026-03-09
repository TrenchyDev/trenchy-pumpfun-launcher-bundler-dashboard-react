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
  website?: string;
  twitter?: string;
  telegram?: string;
}

const METADATA_SYSTEM = `You are a memecoin token namer. Given a short concept or theme, output ONLY valid JSON with exactly these keys (no markdown, no code block):
- "name": A catchy token name (2-4 words max, title case). No generic AI slop like "SuperDoge" or "MoonRocket".
- "symbol": Ticker, 2-8 uppercase letters, no spaces.
- "description": One or two punchy sentences for the token description. Memecoin vibe, not corporate.`;

const METADATA_SYSTEM_WITH_LINKS = METADATA_SYSTEM + `

If "generateDummyLinks" is true, also include these keys with placeholder URLs (fake but realistic-looking):
- "website": A dummy URL like https://example-token.io or https://tokenname.xyz
- "twitter": A dummy Twitter/X URL like https://x.com/tokenname_official
- "telegram": A dummy Telegram URL like https://t.me/tokenname_official`;

export async function generateTokenMetadata(prompt: string, generateDummyLinks = false): Promise<TokenMetadata> {
  const ai = getClient();
  const system = generateDummyLinks ? METADATA_SYSTEM_WITH_LINKS : METADATA_SYSTEM;
  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: `${system}\n\nConcept: ${prompt}${generateDummyLinks ? '\n\ngenerateDummyLinks: true' : ''}` }],
      },
    ],
  });

  const text = res.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned) as TokenMetadata;
  if (!parsed.name || !parsed.symbol) throw new Error('Invalid metadata: missing name or symbol');
  const result: TokenMetadata = {
    name: String(parsed.name).trim(),
    symbol: String(parsed.symbol).trim().toUpperCase().slice(0, 10),
    description: String(parsed.description ?? '').trim(),
  };
  if (generateDummyLinks) {
    if (parsed.website) result.website = String(parsed.website).trim();
    if (parsed.twitter) result.twitter = String(parsed.twitter).trim();
    if (parsed.telegram) result.telegram = String(parsed.telegram).trim();
  }
  return result;
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
    // Lead with strong instruction so the model treats the image as PRIMARY source
    parts.push({
      text: `CRITICAL: The next image is your PRIMARY reference. You MUST create a token logo that depicts THE SAME subject, character, or scene shown in that image. Do NOT invent a different subject. Do NOT ignore the image. Simplify and stylize it for a token logo.\n\n`,
    });
    parts.push({
      inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType },
    });
    parts.push({
      text: `${IMAGE_STYLE_RULES}

Token name: "${tokenName}".
${prompt ? `Additional style hints: ${prompt}` : ''}

Output: One square image, same subject as the reference, mascot/avatar style, centered, bold, no text.`,
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
