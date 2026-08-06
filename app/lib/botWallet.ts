import crypto from 'crypto';
import { Wallet } from 'xrpl';

interface BotWalletRecord {
  nft_id: string;
  address: string;
  encrypted_seed: string;
  owner: string;
  created_at: string;
}

function getMasterKey(): Buffer {
  const value = process.env.BOT_WALLET_MASTER_KEY;
  if (!value) {
    throw new Error('BOT_WALLET_MASTER_KEY is required to use bot wallet encryption');
  }
  if (!/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error('BOT_WALLET_MASTER_KEY must be a 64-character hexadecimal string');
  }
  return Buffer.from(value, 'hex');
}

const MASTER_KEY = getMasterKey();

function encryptSeed(seed: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(seed, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    version: 1,
    algorithm: 'aes-256-gcm',
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  });
}

function decryptSeed(encryptedSeed: string): string {
  let envelope: {
    version?: unknown;
    algorithm?: unknown;
    iv?: unknown;
    authTag?: unknown;
    ciphertext?: unknown;
  };

  try {
    envelope = JSON.parse(encryptedSeed);
  } catch {
    throw new Error('Encrypted bot wallet seed is not a valid encryption envelope');
  }

  if (
    envelope.version !== 1 ||
    envelope.algorithm !== 'aes-256-gcm' ||
    typeof envelope.iv !== 'string' ||
    typeof envelope.authTag !== 'string' ||
    typeof envelope.ciphertext !== 'string'
  ) {
    throw new Error('Encrypted bot wallet seed has an unsupported format');
  }

  const iv = Buffer.from(envelope.iv, 'base64');
  const authTag = Buffer.from(envelope.authTag, 'base64');
  const ciphertext = Buffer.from(envelope.ciphertext, 'base64');

  if (iv.length !== 12 || authTag.length !== 16 || ciphertext.length === 0) {
    throw new Error('Encrypted bot wallet seed has invalid cryptographic fields');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function getSupabaseConfig(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('SUPABASE_URL is required for bot wallet persistence');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for bot wallet persistence');

  return { url: url.replace(/\/$/, ''), key };
}

async function fetchBotWallet(nftId: string): Promise<BotWalletRecord | null> {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(
    `${url}/rest/v1/bot_wallets?nft_id=eq.${encodeURIComponent(nftId)}&select=nft_id,address,encrypted_seed,owner,created_at`,
    {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
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
  if (!nftId || !ownerAddress) {
    throw new Error('nftId and ownerAddress are required to generate a bot wallet');
  }

  const existing = await fetchBotWallet(nftId);
  if (existing) return existing.address;

  const wallet = Wallet.generate();
  const record: BotWalletRecord = {
    nft_id: nftId,
    address: wallet.classicAddress,
    encrypted_seed: encryptSeed(wallet.seed),
    owner: ownerAddress,
    created_at: new Date().toISOString(),
  };

  const stored = await insertBotWallet(record);
  return stored.address;
}

export async function getBotWalletSeed(nftId: string): Promise<string | null> {
  const record = await fetchBotWallet(nftId);
  return record ? decryptSeed(record.encrypted_seed) : null;
}

export async function getBotWalletAddress(nftId: string): Promise<string | null> {
  const record = await fetchBotWallet(nftId);
  return record?.address ?? null;
}
