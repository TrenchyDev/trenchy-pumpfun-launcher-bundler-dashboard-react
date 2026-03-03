/** Per-session user overrides (RPC, Birdeye, Jito). Persists to PostgreSQL on Railway. */
import { Pool } from 'pg';

export interface SessionOverrides {
  rpcEndpoint?: string;
  birdeyeApiKey?: string;
  jitoTipLamports?: number;
}

let pgPool: Pool | null = null;
const memoryStore = new Map<string, SessionOverrides>();

function getPool(): Pool | null {
  if (pgPool) return pgPool;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    pgPool = new Pool({ connectionString: url });
    return pgPool;
  } catch {
    return null;
  }
}

export async function initSessionOverrides(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session_config (
        session_id TEXT PRIMARY KEY,
        rpc_endpoint TEXT,
        birdeye_api_key TEXT,
        jito_tip_lamports INTEGER,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('[SessionOverrides] PostgreSQL initialized');
  } catch (err) {
    console.error('[SessionOverrides] PostgreSQL init failed:', err);
  }
}

export async function getOverrides(sessionId: string): Promise<SessionOverrides> {
  const pool = getPool();
  if (pool) {
    const r = await pool.query(
      'SELECT rpc_endpoint, birdeye_api_key, jito_tip_lamports FROM session_config WHERE session_id = $1',
      [sessionId],
    );
    const row = r.rows[0];
    if (!row) return {};
    return {
      rpcEndpoint: row.rpc_endpoint ?? undefined,
      birdeyeApiKey: row.birdeye_api_key ?? undefined,
      jitoTipLamports: row.jito_tip_lamports != null ? Number(row.jito_tip_lamports) : undefined,
    };
  }
  return memoryStore.get(sessionId) ?? {};
}

export async function setOverrides(
  sessionId: string,
  data: { rpcEndpoint?: string; birdeyeApiKey?: string; jitoTipLamports?: number | null },
): Promise<void> {
  const pool = getPool();
  const current = await getOverrides(sessionId);
  const next: SessionOverrides = {
    rpcEndpoint: data.rpcEndpoint !== undefined ? (data.rpcEndpoint?.trim() || undefined) : current.rpcEndpoint,
    birdeyeApiKey: data.birdeyeApiKey !== undefined ? (data.birdeyeApiKey?.trim() || undefined) : current.birdeyeApiKey,
    jitoTipLamports: data.jitoTipLamports === null ? undefined : (data.jitoTipLamports !== undefined && typeof data.jitoTipLamports === 'number' && !isNaN(data.jitoTipLamports) ? data.jitoTipLamports : current.jitoTipLamports),
  };

  if (pool) {
    const rpc = next.rpcEndpoint ?? null;
    const birdeye = next.birdeyeApiKey ?? null;
    const jito = next.jitoTipLamports ?? null;
    if (rpc || birdeye || jito != null) {
      await pool.query(
        `INSERT INTO session_config (session_id, rpc_endpoint, birdeye_api_key, jito_tip_lamports, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (session_id) DO UPDATE SET rpc_endpoint = $2, birdeye_api_key = $3, jito_tip_lamports = $4, updated_at = NOW()`,
        [sessionId, rpc, birdeye, jito],
      );
    } else {
      await pool.query('DELETE FROM session_config WHERE session_id = $1', [sessionId]);
    }
  } else {
    const current = memoryStore.get(sessionId) ?? {};
    const merged = {
      rpcEndpoint: next.rpcEndpoint ?? current.rpcEndpoint,
      birdeyeApiKey: next.birdeyeApiKey ?? current.birdeyeApiKey,
      jitoTipLamports: next.jitoTipLamports ?? current.jitoTipLamports,
    };
    if (merged.rpcEndpoint || merged.birdeyeApiKey || merged.jitoTipLamports != null) {
      memoryStore.set(sessionId, merged);
    } else {
      memoryStore.delete(sessionId);
    }
  }
}
