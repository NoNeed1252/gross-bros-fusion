import 'server-only';

import crypto from 'crypto';
import { Wallet } from 'xrpl';

interface BotWalletRecord {
  nft_id: string;
  address: string;
  encrypted_seed: string;
  owner: string;
  created_at: string;
}

const ENCRYPTION_VERSION = 1;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const MIN_CIPHERTEXT_BYTES = 1;

function getMasterKey(): Buffer {
  const value = process.env.BOT_WALLET_MASTER_KEY;
  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error('BOT_WALLET_MASTER_KEY must be exactly 64 hexadecimal characters');
  }
  return Buffer.from(value, 'hex');
}

const MASTER_KEY = getMasterKey();

function encryptSeed(seed: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, MASTER_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(seed, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    version: ENCRYPTION_VERSION,
    algorithm: ENCRYPTION_ALGORITHM,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  });
}

function decodeBase64(value: unknown, fieldName: string): Buffer {
  if (typeof value !== 'string' || value.length === 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error(`Encrypted bot wallet seed has invalid ${fieldName} base64`);
  }

  const decoded = Buffer.from(value, 'base64');
  if (decoded.toString('base64').replace(/=+$/, '') !== value.replace(/=+$/, '')) {
    throw new Error(`Encrypted bot wallet seed has invalid ${fieldName} base64`);
  }
  return decoded;
}

function decryptSeed(encryptedSeed: string): string {
  let envelope: unknown;
  try {
    envelope = JSON.parse(encryptedSeed);
  } catch {
    throw new Error('Encrypted bot wallet seed is not a valid JSON envelope');
  }

  if (!envelope || typeof envelope !== 'object') {
    throw new Error('Encrypted bot wallet seed envelope is invalid');
  }

  const value = envelope as Record<string, unknown>;
  if (value.version !== ENCRYPTION_VERSION || value.algorithm !== ENCRYPTION_ALGORITHM) {
    throw new Error('Encrypted bot wallet seed uses an unsupported format');
  }

  const iv = decodeBase64(value.iv, 'IV');
  const authTag = decodeBase64(value.authTag, 'authentication tag');
  const ciphertext = decodeBase64(value.ciphertext, 'ciphertext');

  if (iv.length !== IV_BYTES) {
    throw new Error(`Encrypted bot wallet seed IV must be ${IV_BYTES} bytes`);
  }
  if (authTag.length !== AUTH_TAG_BYTES) {
    throw new Error(`Encrypted bot wallet seed authentication tag must be ${AUTH_TAG_BYTES} bytes`);
  }
  if (ciphertext.length < MIN_CIPHERTEXT_BYTES) {
    throw new Error('Encrypted bot wallet seed ciphertext is empty');
  }

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, MASTER_KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function validateNftId(nftId: string): void {
  if (typeof nftId !== 'string' || nftId.trim().length === 0 || nftId.length > 255 || /[\u0000-\u001f\u007f]/.test(nftId)) {
    throw new Error('nftId must be a non-empty string of at most 255 characters without control characters');
  }
}

function validateOwnerAddress(ownerAddress: string): void {
  if (
    typeof ownerAddress !== 'string' ||
    !/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(ownerAddress)
  ) {
    throw new Error('ownerAddress must be a valid-looking XRPL classic address');
  }

  try {
    if (!Wallet.isValidAddress(ownerAddress)) {
      throw new Error('invalid address');
    }
  } catch {
    throw new Error('ownerAddress must be a valid XRPL classic address');
  }
}

function getSupabaseConfig(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('SUPABASE_URL is required for bot wallet persistence');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for bot wallet persistence');
  return { url: url.replace(/\/$/, ''), key };
}

async function fetchBotWallet(nftId: string): Promise<BotWalletRecord | null> {
  validateNftId(nftId);
  const { url, key } = getSupabaseConfig();
  const response = await fetch(
    `${url}/rest/v1/bot_wallets?nft_id=eq.${encodeURIComponent(nftId)}&select=nft_id,address,encrypted_seed,owner,created_at`,
    {
      method: 'GET',
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase bot wallet lookup failed: ${response.status} ${details}`);
  }

  const rows = (await response.json()) as BotWalletRecord[];
  return rows[0] ?? null;
}

async function insertBotWallet(record: BotWalletRecord): Promise<BotWalletRecord> {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/bot_wallets`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'return=representation,resolution=ignore-duplicates',
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase bot wallet insert failed: ${response.status} ${details}`);
  }

  const rows = (await response.json()) as BotWalletRecord[];
  if (rows[0]) return rows[0];

  const existing = await fetchBotWallet(record.nft_id);
  if (!existing) {
    throw new Error('Bot wallet insert returned no record and no existing wallet was found');
  }
  return existing;
}

export async function generateBotWallet(nftId: string, ownerAddress: string): Promise<string> {
  validateNftId(nftId);
  validateOwnerAddress(ownerAddress);

  const existing = await fetchBotWallet(nftId);
  if (existing) {
    if (existing.owner !== ownerAddress) {
      throw new Error('Existing bot wallet owner does not match the requested owner');
    }
    return existing.address;
  }

  const wallet = Wallet.generate();
  const record: BotWalletRecord = {
    nft_id: nftId,
    address: wallet.classicAddress,
    encrypted_seed: encryptSeed(wallet.seed),
    owner: ownerAddress,
    created_at: new Date().toISOString(),
  };

  const stored = await insertBotWallet(record);
  if (stored.owner !== ownerAddress) {
    throw new Error('Stored bot wallet owner does not match the requested owner');
  }
  return stored.address;
}

export async function getBotWalletSeed(nftId: string): Promise<string | null> {
  validateNftId(nftId);
  const record = await fetchBotWallet(nftId);
  return record ? decryptSeed(record.encrypted_seed) : null;
}

export async function getBotWalletAddress(nftId: string): Promise<string | null> {
  validateNftId(nftId);
  const record = await fetchBotWallet(nftId);
  return record?.address ?? null;
}
