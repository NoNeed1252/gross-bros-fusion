/**
 * Simple encrypted vault for storing the burner bot keypair in the browser.
 * Uses Web Crypto's AES‑GCM with a static derived key (for demo purposes).
 * In production you would derive the key from a user passphrase via PBKDF2.
 */

export interface BotKeypair {
  seed: string;
  publicKey: string;
  privateKey: string;
  address: string;
}

const VAULT_STORAGE_KEY = 'burner_bot_vault';

/** Generate a static CryptoKey for encryption. Replace with proper key‑derivation in real use. */
async function getStaticKey(): Promise<CryptoKey> {
  const raw = new TextEncoder().encode('poke-static-vault-key-2026');
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/** Encrypt and store the keypair in localStorage. */
export async function saveKeypair(kp: BotKeypair): Promise<void> {
  const key = await getStaticKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(kp));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const stored = {
    iv: Array.from(iv),
    payload: Array.from(new Uint8Array(encrypted)),
  };
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(stored));
}

/** Decrypt and retrieve the stored keypair, or null if none / decryption fails. */
export async function loadKeypair(): Promise<BotKeypair | null> {
  const item = localStorage.getItem(VAULT_STORAGE_KEY);
  if (!item) return null;
  try {
    const { iv, payload } = JSON.parse(item);
    const key = await getStaticKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(payload)
    );
    const json = new TextDecoder().decode(decrypted);
    return JSON.parse(json) as BotKeypair;
  } catch {
    return null;
  }
}

/** Remove the vault entry entirely. */
export function clearVault(): void {
  localStorage.removeItem(VAULT_STORAGE_KEY);
}

/**
 * Ensure a keypair exists: load an existing one or generate a fresh one using lib/keypair.
 * Returns the ready BotKeypair.
 */
export async function ensureKeypair(): Promise<BotKeypair> {
  const existing = await loadKeypair();
  if (existing) return existing;
  // Lazy‑load the keypair generator to avoid circular imports.
  const { createBotKeypair } = await import('./keypair');
  const kp = createBotKeypair();
  await saveKeypair(kp);
  return kp;
}
