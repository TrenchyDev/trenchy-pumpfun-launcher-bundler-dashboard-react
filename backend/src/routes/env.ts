import { Router, Request } from 'express';
import * as sessionOverrides from '../services/session-overrides';

const router = Router();

/** Server env keys - NEVER expose values to frontend. Only isSet for operational status. */
const SERVER_KEYS = [
  { key: 'RPC_ENDPOINT', label: 'RPC Endpoint', required: true },
  { key: 'ENCRYPTION_KEY', label: 'Encryption Key', required: true },
  { key: 'BIRDEYE_API_KEY', label: 'Birdeye API Key', required: false },
];

router.get('/', (_req: Request, res) => {
  try {
    const entries = SERVER_KEYS.map(({ key, label, required }) => ({
      key,
      label,
      required,
      isSet: !!(process.env[key]?.trim()),
      value: '', // Never expose server values to frontend
    }));
    const missingRequired = entries.filter(e => e.required && !e.isSet).map(e => e.key);
    res.json({ entries, missingRequired });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/** User overrides - RPC, Birdeye, Jito tip. Stored per session (PostgreSQL on Railway). */
router.get('/overrides', async (req: Request, res) => {
  const sessionId = (req.headers['x-session-id'] as string)?.trim();
  if (!sessionId) return res.json({ rpcEndpoint: '', birdeyeApiKey: '', jitoTipLamports: undefined, rpcEndpointSet: false, birdeyeApiKeySet: false });
  const o = await sessionOverrides.getOverrides(sessionId);
  res.json({
    rpcEndpoint: o.rpcEndpoint ?? '',
    birdeyeApiKey: '', // Never send API key back to frontend
    jitoTipLamports: o.jitoTipLamports ?? undefined,
    rpcEndpointSet: !!(o.rpcEndpoint?.trim()),
    birdeyeApiKeySet: !!(o.birdeyeApiKey?.trim()),
  });
});

router.put('/overrides', async (req: Request, res) => {
  const sessionId = (req.headers['x-session-id'] as string)?.trim();
  if (!sessionId) return res.status(400).json({ error: 'Session required' });
  const { rpcEndpoint, birdeyeApiKey, jitoTipLamports } = req.body ?? {};
  await sessionOverrides.setOverrides(sessionId, {
    rpcEndpoint: typeof rpcEndpoint === 'string' ? rpcEndpoint : undefined,
    birdeyeApiKey: typeof birdeyeApiKey === 'string' ? birdeyeApiKey : undefined,
    jitoTipLamports: jitoTipLamports === null ? null : (typeof jitoTipLamports === 'number' && !isNaN(jitoTipLamports) ? jitoTipLamports : (typeof jitoTipLamports === 'string' && jitoTipLamports.trim() ? parseInt(jitoTipLamports, 10) : undefined)),
  });
  res.json({ success: true });
});

router.put('/', (_req: Request, res) => {
  res.status(400).json({ error: 'Server config is in .env. Edit backend/.env and restart.' });
});

export default router;
