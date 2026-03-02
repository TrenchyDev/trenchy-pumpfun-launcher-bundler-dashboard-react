import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const ENV_PATH = path.join(__dirname, '../../.env');

const ENV_KEYS = [
  { key: 'FUNDING_PRIVATE_KEY', label: 'Funding Private Key', sensitive: true, required: true },
  { key: 'RPC_ENDPOINT', label: 'RPC Endpoint', sensitive: false, required: true },
  { key: 'JITO_TIP_LAMPORTS', label: 'Jito Tip (lamports)', sensitive: false, required: true },
  { key: 'ENCRYPTION_KEY', label: 'Encryption Key', sensitive: true, required: true },
  { key: 'BIRDEYE_API_KEY', label: 'Birdeye API Key', sensitive: true, required: false },
];

function parseEnv(): Record<string, string> {
  if (!fs.existsSync(ENV_PATH)) return {};
  const raw = fs.readFileSync(ENV_PATH, 'utf-8');
  const result: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    result[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return result;
}

function writeEnv(vars: Record<string, string>): void {
  const lines = ENV_KEYS.map(({ key }) => `${key}=${vars[key] ?? ''}`);
  fs.writeFileSync(ENV_PATH, lines.join('\n') + '\n', 'utf-8');
}

router.get('/', (_req, res) => {
  try {
    const vars = parseEnv();
    const entries = ENV_KEYS.map(({ key, label, sensitive, required }) => ({
      key,
      label,
      value: vars[key] ?? '',
      sensitive,
      required,
      isSet: !!(vars[key]?.trim()),
    }));
    const missingRequired = entries.filter(e => e.required && !e.isSet).map(e => e.key);
    res.json({ entries, missingRequired });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', (req, res) => {
  try {
    const current = parseEnv();
    const updates: Record<string, string> = req.body.values ?? {};
    for (const { key } of ENV_KEYS) {
      if (key in updates) current[key] = updates[key];
    }
    writeEnv(current);

    for (const [k, v] of Object.entries(updates)) {
      process.env[k] = v;
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
