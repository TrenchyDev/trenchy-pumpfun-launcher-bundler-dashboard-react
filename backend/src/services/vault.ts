import { Keypair } from '@solana/web3.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import bs58 from 'bs58';

export interface StoredWallet {
  id: string;
  publicKey: string;
  privateKey: string;
  type: 'funding' | 'dev' | 'bundle' | 'holder' | 'manual' | 'mint' | 'sniper';
  label: string;
  status: 'active' | 'archived';
  createdAt: string;
  launchId?: string;
}

interface LegacyWallet {
  id: string;
  publicKey: string;
  encryptedKey: string;
  iv: string;
  type: StoredWallet['type'];
  label: string;
  status: 'active' | 'archived';
  createdAt: string;
  launchId?: string;
}

const DATA_FILE = path.join(__dirname, '../../keys/wallets.json');
const IMPORTED_FILE = path.join(__dirname, '../../keys/imported-wallets.json');

function legacyDecrypt(encrypted: string, iv: string): string {
  const raw = process.env.ENCRYPTION_KEY || 'default-key-change-me-32-chars!!';
  const key = crypto.createHash('sha256').update(raw).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function readAll(): StoredWallet[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const wallets = JSON.parse(raw || '[]') as any[];

  let migrated = false;
  const result: StoredWallet[] = wallets.map(w => {
    if (w.encryptedKey && w.iv && !w.privateKey) {
      migrated = true;
      try {
        const pk = legacyDecrypt(w.encryptedKey, w.iv);
        return {
          id: w.id,
          publicKey: w.publicKey,
          privateKey: pk,
          type: w.type === 'manual' && w.launchId && w.label?.startsWith('Mint - ') ? 'mint' : w.type,
          label: w.label,
          status: w.status,
          createdAt: w.createdAt,
          ...(w.launchId && { launchId: w.launchId }),
        };
      } catch {
        return {
          id: w.id,
          publicKey: w.publicKey,
          privateKey: '',
          type: w.type,
          label: w.label + ' (migration-failed)',
          status: w.status,
          createdAt: w.createdAt,
          ...(w.launchId && { launchId: w.launchId }),
        };
      }
    }

    if (w.type === 'manual' && w.launchId && w.label?.startsWith('Mint - ')) {
      migrated = true;
      w.type = 'mint';
    }

    return w as StoredWallet;
  });

  if (migrated) writeAll(result);
  return result;
}

function writeAll(wallets: StoredWallet[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(wallets, null, 2));
}

export function generateAndStore(
  type: StoredWallet['type'],
  label: string,
  launchId?: string,
): { wallet: StoredWallet; keypair: Keypair } {
  const keypair = Keypair.generate();
  const secretB58 = bs58.encode(keypair.secretKey);

  const wallet: StoredWallet = {
    id: crypto.randomUUID(),
    publicKey: keypair.publicKey.toBase58(),
    privateKey: secretB58,
    type,
    label,
    status: 'active',
    createdAt: new Date().toISOString(),
    launchId,
  };

  const wallets = readAll();
  wallets.push(wallet);
  writeAll(wallets);

  return { wallet, keypair };
}

export function importAndStore(
  keypair: Keypair,
  type: StoredWallet['type'],
  label: string,
  launchId?: string,
): StoredWallet {
  const secretB58 = bs58.encode(keypair.secretKey);

  const wallet: StoredWallet = {
    id: crypto.randomUUID(),
    publicKey: keypair.publicKey.toBase58(),
    privateKey: secretB58,
    type,
    label,
    status: 'active',
    createdAt: new Date().toISOString(),
    launchId,
  };

  const wallets = readAll();
  wallets.push(wallet);
  writeAll(wallets);

  return wallet;
}

export function importKey(
  privateKeyB58: string,
  type: StoredWallet['type'],
  label: string,
): StoredWallet {
  const kp = Keypair.fromSecretKey(bs58.decode(privateKeyB58));

  const wallet: StoredWallet = {
    id: crypto.randomUUID(),
    publicKey: kp.publicKey.toBase58(),
    privateKey: privateKeyB58,
    type,
    label,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const imported = readImported();
  if (imported.some(w => w.publicKey === wallet.publicKey)) {
    throw new Error('Wallet already imported');
  }
  imported.push(wallet);
  writeImported(imported);

  return wallet;
}

function readImported(): StoredWallet[] {
  if (!fs.existsSync(IMPORTED_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(IMPORTED_FILE, 'utf8') || '[]'); } catch { return []; }
}

function writeImported(wallets: StoredWallet[]) {
  const dir = path.dirname(IMPORTED_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(IMPORTED_FILE, JSON.stringify(wallets, null, 2));
}

export function listImported(): StoredWallet[] {
  return readImported();
}

export function deleteImported(walletId: string): boolean {
  const imported = readImported();
  const idx = imported.findIndex(w => w.id === walletId);
  if (idx === -1) return false;
  imported.splice(idx, 1);
  writeImported(imported);
  return true;
}

export function getImportedKeypair(walletId: string): Keypair | null {
  const w = readImported().find(w => w.id === walletId);
  if (!w) return null;
  return Keypair.fromSecretKey(bs58.decode(w.privateKey));
}

export function getImportedPrivateKey(walletId: string): string | null {
  const w = readImported().find(w => w.id === walletId);
  return w?.privateKey ?? null;
}

export function updateImportedLabel(walletId: string, label: string): StoredWallet | null {
  const imported = readImported();
  const w = imported.find(w => w.id === walletId);
  if (!w) return null;
  w.label = label;
  writeImported(imported);
  return w;
}

export function assignToLaunch(walletId: string, launchId: string): { wallet: StoredWallet; keypair: Keypair } {
  const imported = readImported();
  const iw = imported.find(w => w.id === walletId);
  if (iw) {
    if (iw.status !== 'active') throw new Error(`Wallet ${walletId} is ${iw.status}, cannot assign`);
    iw.launchId = launchId;
    writeImported(imported);
    const keypair = Keypair.fromSecretKey(bs58.decode(iw.privateKey));
    return { wallet: iw, keypair };
  }

  const wallets = readAll();
  const w = wallets.find(w => w.id === walletId);
  if (!w) throw new Error(`Wallet ${walletId} not found`);
  if (w.status !== 'active') throw new Error(`Wallet ${walletId} is ${w.status}, cannot assign`);
  w.launchId = launchId;
  writeAll(wallets);
  const keypair = Keypair.fromSecretKey(bs58.decode(w.privateKey));
  return { wallet: w, keypair };
}

export function listAvailable(): StoredWallet[] {
  const launch = readAll().filter(w => w.status === 'active' && !w.launchId && w.type !== 'funding' && w.type !== 'mint');
  const imported = readImported().filter(w => w.status === 'active' && !w.launchId);
  return [...imported, ...launch];
}

export function getKeypair(walletId: string): Keypair {
  const iw = readImported().find(w => w.id === walletId);
  if (iw) return Keypair.fromSecretKey(bs58.decode(iw.privateKey));
  const wallets = readAll();
  const w = wallets.find(w => w.id === walletId);
  if (!w) throw new Error(`Wallet ${walletId} not found`);
  return Keypair.fromSecretKey(bs58.decode(w.privateKey));
}

export function getKeypairByPublicKey(pubkey: string): Keypair {
  const iw = readImported().find(w => w.publicKey === pubkey);
  if (iw) return Keypair.fromSecretKey(bs58.decode(iw.privateKey));
  const wallets = readAll();
  const w = wallets.find(w => w.publicKey === pubkey);
  if (!w) throw new Error(`Wallet with pubkey ${pubkey} not found`);
  return Keypair.fromSecretKey(bs58.decode(w.privateKey));
}

export function getPrivateKey(walletId: string): string {
  const iw = readImported().find(w => w.id === walletId);
  if (iw) return iw.privateKey;
  const wallets = readAll();
  const w = wallets.find(w => w.id === walletId);
  if (!w) throw new Error(`Wallet ${walletId} not found`);
  return w.privateKey;
}

export function listWallets(filter?: { type?: string; status?: string }): StoredWallet[] {
  let wallets = readAll();
  if (filter?.type) wallets = wallets.filter(w => w.type === filter.type);
  if (filter?.status) wallets = wallets.filter(w => w.status === filter.status);
  return wallets;
}

export function archiveWallet(walletId: string): StoredWallet | null {
  const wallets = readAll();
  const idx = wallets.findIndex(w => w.id === walletId);
  if (idx === -1) return null;
  wallets[idx].status = 'archived';
  writeAll(wallets);
  return wallets[idx];
}

export function unarchiveWallet(walletId: string): StoredWallet | null {
  const wallets = readAll();
  const idx = wallets.findIndex(w => w.id === walletId);
  if (idx === -1) return null;
  wallets[idx].status = 'active';
  writeAll(wallets);
  return wallets[idx];
}

export function generateBatch(
  count: number,
  type: StoredWallet['type'],
  labelPrefix: string,
  launchId?: string,
): { wallet: StoredWallet; keypair: Keypair }[] {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(generateAndStore(type, `${labelPrefix} ${i + 1}`, launchId));
  }
  return results;
}
