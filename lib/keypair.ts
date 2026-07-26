import { generateSeed as xrplGenerateSeed, deriveKeypair as xrplDeriveKeypair, deriveAddress as xrplDeriveAddress } from 'xrpl';

/**
 * Generate a random ED25519 seed using xrpl utilities.
 * The seed is a base58 string suitable for XRPL wallets.
 */
export function generateSeed(): string {
  // xrpl's generateSeed will create a random 16‑byte seed when called without args.
  // For explicit entropy we could pass a Uint8Array, but the default is sufficient for a local burner bot.
  return xrplGenerateSeed();
}

/**
 * Derive a keypair (public / private keys) from an XRPL seed.
 */
export function deriveKeypairFromSeed(seed: string) {
  return xrplDeriveKeypair(seed);
}

/**
 * Derive the classic XRPL address from a public key.
 */
export function addressFromPublicKey(publicKey: string): string {
  return xrplDeriveAddress(publicKey);
}

/**
 * Convenience helper that creates a full keypair object with address.
 */
export interface BotKeypair {
  seed: string;
  publicKey: string;
  privateKey: string;
  address: string;
}

export function createBotKeypair(): BotKeypair {
  const seed = generateSeed();
  const { publicKey, privateKey } = deriveKeypairFromSeed(seed);
  const address = addressFromPublicKey(publicKey);
  return { seed, publicKey, privateKey, address };
}
