import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Wallet } from 'xrpl';

/**
 * Utility for handling bot wallets associated with Gross Bros NFTs.
 * Supports generation, encryption, storage (Supabase or local JSON), and retrieval.
 */

interface BotWalletRecord {
  nft_id: string;
  address: string;
  encrypted_seed: string; // base64
  owner: string;
  created_at: string; // ISO timestamp
}

/** Derive a 32‑byte AES‑256‑GCM key.
 * Prefer BOT_WALLET_MASTER_KEY (hex). If absent, fall back to PBKDF2 using a static salt.
 */
function getMasterKey(): Buffer {
  const envKey = process.env.BOT_WALLET_MASTER_KEY;
  if (envKey) {
    try {
      const buf = Buffer.from(envKey, 'hex');
      if (buf.length !== 32) throw new Error('Invalid length');
      return buf;
    } catch (e) {
      console.warn('BOT_WALLET_MASTER_KEY is malformed, falling back to derived key');
    }
  }
  // fallback: derive from a static secret (could be app id) and a salt
  const password = process.env.NEXT_PUBLIC_APP_ID || 'gross-bros-fusion-fallback';
  const salt = 'bot-wallet-salt';
  console.warn('BOT_WALLET_MASTER_KEY missing – using PBKDF2 derived key');
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

const MASTER_KEY = getMasterKey();

function encryptSeed(seed: string): string {
  const iv = crypto.randomBytes(12); // 96‑bit nonce for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(seed, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store iv + auth tag + ciphertext, base64 encoded
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptSeed(blob: string): string {
  const data = Buffer.from(blob, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/** Supabase helper – insert or upsert a record. */
async function supabaseUpsert(record: BotWalletRecord): Promise<void> {
  const url = process.env.SUPABASE_URL || 'https://bwvnhlmvyjuowyyltraw.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Supabase service key missing');
  const resp = await fetch(`${url}/rest/v1/bot_wallets`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates', // upsert on primary key (nft_id)
    },
    body: JSON.stringify(record),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Supabase upsert failed: ${resp.status} ${txt}`);
  }
}

/** Supabase fetch by nft_id */
async function supabaseFetch(nftId: string): Promise<BotWalletRecord | null> {
  const url = process.env.SUPABASE_URL || 'https://bwvnhlmvyjuowyyltraw.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  const resp = await fetch(`${url}/rest/v1/bot_wallets?nft_id=eq.${encodeURIComponent(nftId)}`, {
    method: 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  });
  if (!resp.ok) return null;
  const rows = (await resp.json()) as BotWalletRecord[];
  return rows[0] || null;
}

/** Local JSON fallback path */
const LOCAL_DB_PATH = '/tmp/bot-wallets.json';

function ensureLocalDb(): BotWalletRecord[] {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
      return JSON.parse(raw) as BotWalletRecord[];
    }
  } catch (e) {
    console.error('Failed to read local bot wallet db', e);
  }
  return [];
}

function writeLocalDb(records: BotWalletRecord[]): void {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(records, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write local bot wallet db', e);
  }
}

/** Store a wallet record using Supabase if possible, otherwise local file. */
async function storeRecord(record: BotWalletRecord): Promise<void> {
  try {
    await supabaseUpsert(record);
  } catch (e) {
    console.warn('Supabase store failed, falling back to local JSON', e);
    const records = ensureLocalDb();
    const idx = records.findIndex(r => r.nft_id === record.nft_id);
    if (idx >= 0) records[idx] = record; else records.push(record);
    writeLocalDb(records);
  }
}

/** Retrieve a wallet record, preferring Supabase, then local file. */
async function getRecord(nftId: string): Promise<BotWalletRecord | null> {
  try {
    const rec = await supabaseFetch(nftId);
    if (rec) return rec;
  } catch (e) {
    console.warn('Supabase fetch failed, trying local', e);
  }
  const records = ensureLocalDb();
  return records.find(r => r.nft_id === nftId) || null;
}

/** Generate (or re‑use) a classic XRPL wallet for a given NFT. */
export async function generateBotWallet(nftId: string, ownerAddress: string): Promise<string> {
  // Check if already exists
  const existing = await getRecord(nftId);
  if (existing) {
    // Decrypt and return address
    return existing.address;
  }
  // Create a new classic wallet (seed based)
  const wallet = Wallet.generate();
  const encrypted = encryptSeed(wallet.seed);
  const record: BotWalletRecord = {
    nft_id: nftId,
    address: wallet.classicAddress,
    encrypted_seed: encrypted,
    owner: ownerAddress,
    created_at: new Date().toISOString(),
  };
  await storeRecord(record);
  return wallet.classicAddress;
}

/** Retrieve and decrypt the seed for a bot wallet. */
export async function getBotWalletSeed(nftId: string): Promise<string | null> {
  const rec = await getRecord(nftId);
  if (!rec) return null;
  try {
    return decryptSeed(rec.encrypted_seed);
  } catch (e) {
    console.error('Failed to decrypt bot wallet seed', e);
    return null;
  }
}

/** Retrieve the classic address for a bot wallet (no decryption needed). */
export async function getBotWalletAddress(nftId: string): Promise<string | null> {
  const rec = await getRecord(nftId);
  return rec?.address || null;
}
