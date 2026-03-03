/**
 * Kills all processes using ports 5173 (frontend) and 3001 (backend).
 * Run before starting dev to avoid EADDRINUSE.
 */
const { execSync } = require('child_process');

const PORTS = [5173, 3001];

function killPort(port) {
  try {
    const out = execSync(
      `(Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 } | Select-Object -ExpandProperty OwningProcess -Unique)`,
      { shell: 'powershell.exe', encoding: 'utf8' }
    ).trim();

    if (!out) return;

    const pids = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
        console.log(`[kill-ports] Killed PID ${pid} on port ${port}`);
      } catch {}
    }
  } catch {
    // No connections on port — nothing to do
  }
}

console.log('[kill-ports] Clearing ports 5173 (frontend) and 3001 (backend)...');
PORTS.forEach(killPort);
console.log('[kill-ports] Done.');
