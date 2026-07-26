import { generateBurnerSeed, deriveBurnerWallet, BurnerWallet } from './keypair';

const VAULT_STORAGE_KEY = 'tgb_masterstroke_vault_seed';

export function getStoredBurnerSeed(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(VAULT_STORAGE_KEY);
}

export function saveBurnerSeed(seed: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VAULT_STORAGE_KEY, seed);
}

export function clearStoredVault(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(VAULT_STORAGE_KEY);
}

export function getOrCreateBurnerWallet(): BurnerWallet {
  let seed = getStoredBurnerSeed();
  if (!seed) {
    seed = generateBurnerSeed();
    saveBurnerSeed(seed);
  }
  return deriveBurnerWallet(seed);
}
