import { Request, Response, NextFunction } from 'express';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import jwt from 'jsonwebtoken';
import * as fundingStore from '../services/funding-store';

export interface FundingRequest extends Request {
  fundingKeypair?: Keypair;
  sessionId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const isDeployed = !!process.env.DATABASE_URL;

export async function fundingMiddleware(req: FundingRequest, res: Response, next: NextFunction) {
  const keyFromHeader = (req.headers['x-funding-key'] as string)?.trim();
  const sessionIdFromHeader = (req.headers['x-session-id'] as string)?.trim();

  if (keyFromHeader) {
    try {
      req.fundingKeypair = Keypair.fromSecretKey(bs58.decode(keyFromHeader));
      req.sessionId = sessionIdFromHeader || undefined;
      return next();
    } catch {
      return res.status(400).json({ error: 'Invalid funding key' });
    }
  }

  // Deployed: try userId from JWT first
  if (isDeployed) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: number };
        const key = await fundingStore.getFundingKey(`user_${payload.userId}`);
        if (key) {
          req.fundingKeypair = fundingStore.getFundingKeypairFromKey(key);
          req.sessionId = `user_${payload.userId}`;
          return next();
        }
      } catch {}
    }
  }

  // Local: session from header
  if (sessionIdFromHeader) {
    const key = await fundingStore.getFundingKey(sessionIdFromHeader);
    if (key) {
      req.fundingKeypair = fundingStore.getFundingKeypairFromKey(key);
      req.sessionId = sessionIdFromHeader;
      return next();
    }
  }

  const envKey = process.env.FUNDING_PRIVATE_KEY;
  if (envKey && envKey !== 'YOUR_BASE58_PRIVATE_KEY_HERE') {
    try {
      req.fundingKeypair = Keypair.fromSecretKey(bs58.decode(envKey));
      return next();
    } catch {}
  }

  return res.status(401).json({ error: 'Funding wallet not configured. Enter your funding private key in Setup.' });
}
