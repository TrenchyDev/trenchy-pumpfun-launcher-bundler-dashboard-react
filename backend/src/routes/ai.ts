import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import * as gemini from '../services/gemini';

const router = Router();
const UPLOADS_DIR = path.join(__dirname, '../../data/uploads');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

router.post('/generate-token', upload.single('image'), async (req: Request, res: Response) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }
  const generateDummyLinks = req.body?.generateDummyLinks === 'true' || req.body?.generateDummyLinks === true;

  let referenceImage: { base64: string; mimeType: string } | undefined;
  if (req.file && req.file.buffer.length > 0) {
    referenceImage = {
      base64: req.file.buffer.toString('base64'),
      mimeType: req.file.mimetype || 'image/png',
    };
  }

  try {
    const metadata = await gemini.generateTokenMetadata(prompt, generateDummyLinks);
    let imageBuffer: Buffer | null = null;
    try {
      imageBuffer = await gemini.generateTokenImage(prompt, metadata.name, referenceImage);
    } catch (_) {}

    if (!imageBuffer || imageBuffer.length === 0) {
      return res.status(200).json({
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        imageUrl: '',
        website: metadata.website,
        twitter: metadata.twitter,
        telegram: metadata.telegram,
      });
    }

    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const filename = `${uuid()}.png`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, imageBuffer);

    const imageUrl = `/api/uploads/${filename}`;
    res.status(200).json({
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description,
      imageUrl,
      website: metadata.website,
      twitter: metadata.twitter,
      telegram: metadata.telegram,
    });
  } catch (err: any) {
    console.error('[AI] generate-token error:', err?.message || err);
    res.status(500).json({
      error: err?.message || 'AI generation failed',
    });
  }
});

export default router;
