import { deriveKeypair, deriveAddress } from 'ripple-keypairs';

export interface BurnerWallet {
  seed: string;
  publicKey: string;
  privateKey: string;
  address: string;
}

export function generateBurnerSeed(): string {
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function deriveBurnerWallet(seed: string): BurnerWallet {
  const keypair = deriveKeypair(seed);
  const address = deriveAddress(keypair.publicKey);
  return {
    seed,
    publicKey: keypair.publicKey,
    privateKey: keypair.privateKey,
    address,
  };
}
