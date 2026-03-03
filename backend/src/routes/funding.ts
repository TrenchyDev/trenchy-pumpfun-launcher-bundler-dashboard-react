import { Router, Request, Response } from 'express';
import * as fundingStore from '../services/funding-store';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const isDeployed = !!process.env.DATABASE_URL;

/** Deployed: require auth; Local: use sessionId from body */
router.post('/save', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  const { sessionId, privateKey } = req.body;
  if (!privateKey || typeof privateKey !== 'string') {
    return res.status(400).json({ error: 'privateKey required' });
  }
  try {
    const key = privateKey.trim();
    if (isDeployed) {
      if (req.userId == null) return res.status(401).json({ error: 'Login required' });
      await fundingStore.saveFundingKey(`user_${req.userId}`, key);
    } else {
      if (!sessionId || typeof sessionId !== 'string') return res.status(400).json({ error: 'sessionId required' });
      await fundingStore.saveFundingKey(sessionId.trim(), key);
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Funding] Save failed:', err?.message ?? err);
    res.status(400).json({ error: err?.message ?? 'Failed to save funding key' });
  }
});

/** Status: env key (local) > auth (deployed) > session (local) */
router.get('/status', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  // Local mode: env FUNDING_PRIVATE_KEY = configured, no Setup needed
  const envKey = process.env.FUNDING_PRIVATE_KEY;
  if (envKey && envKey !== 'YOUR_BASE58_PRIVATE_KEY_HERE') {
    try {
      const kp = fundingStore.getFundingKeypairFromKey(envKey);
      return res.json({ configured: true, publicKey: kp.publicKey.toBase58(), fromEnv: true });
    } catch {}
  }

  const sessionId = isDeployed && req.userId != null
    ? `user_${req.userId}`
    : (req.headers['x-session-id'] as string)?.trim();
  if (!sessionId) return res.json({ configured: false });

  const key = await fundingStore.getFundingKey(sessionId);
  if (!key) return res.json({ configured: false });
  try {
    const kp = fundingStore.getFundingKeypairFromKey(key);
    res.json({ configured: true, publicKey: kp.publicKey.toBase58() });
  } catch {
    res.json({ configured: false });
  }
});

router.delete('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  const sessionId = isDeployed && req.userId != null
    ? `user_${req.userId}`
    : (req.headers['x-session-id'] as string)?.trim();
  if (sessionId) await fundingStore.deleteFundingKey(sessionId);
  res.json({ success: true });
});

export default router;
