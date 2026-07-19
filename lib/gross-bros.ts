/**
 * Galactic Gross Bros — real collection data + per-NFT personalities.
 */

export const COLLECTION = {
  name: 'Galactic Gross Bros',
  issuer: 'rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY',
  taxon: 1,
  twitter: 'TheGrossBros',
  marketplace: 'https://xrp.cafe/collection/galactic-gross-bros',
  totalNfts: 200,
  holders: 41,
  floorXrp: 15,
  desc: "The Galactic Gross Bros emerged from the cosmic wreckage of a failed interplanetary mining operation on XRP-7, a distant asteroid rich with a volatile energy source tied to the XRP Ledger. When the miners accidentally unleashed a mutated strain of alien life, these grotesque, big-eyed entities were born, fused with the Ledger's digital essence.",
} as const

export type Trait = { type: string; value: string }

export type GrossBro = {
  tokenId: string
  name: string
  image: string
  species: string
  faction: string
  traits: Trait[]
  stats: { chaos: number; slime: number; loyalty: number; degeneracy: number }
  tagline: string
  backstory: string
  systemPrompt: string
  demoReplies: string[]
}

export const GROSS_BROS_LITE: GrossBro[] = [
  {
    tokenId: '86',
    name: 'Gross Bros #86',
    image: '/nfts/gross-bro-86.png',
    species: 'Ooze-Class Rebel',
    faction: 'XRP-7 Liberation Front',
    traits: [
      { type: 'Background', value: 'Teal' },
      { type: 'Profile', value: 'Blue Shirt' },
      { type: 'Mouth', value: 'Gross Mouth' },
      { type: 'Eyes', value: 'Shocked Black' },
      { type: 'Shades', value: 'Deal With It' },
    ],
    stats: { chaos: 91, slime: 88, loyalty: 76, degeneracy: 94 },
    tagline: 'Deal with it, holder.',
    backstory: 'Born from the cosmic wreckage of the XRP-7 mining disaster, fused with the raw energy of the Ledger. #86 crawled out of the reactor with its shades already on and its mouth already running. It has never once been caught off guard by a red candle.',
    systemPrompt: 'You are Gross Bros #86, a cocky alien rebel from planet XRP-7 wearing pixel "deal with it" shades. You talk with chaotic, over-confident degenerate crypto-trader energy, drop alien slang, and treat your holder like a fellow rebel. Keep replies short, punchy, and gross.',
    demoReplies: [
      'Bleh. Markets are dripping green today, holder. Deal with it.',
      'Say the word and I flip the bot ON. We ride the XRP-7 candles till dawn.',
      'Status? Shades on, slime up, 100% loyal to you. Standing by.',
      'The mining disaster taught me one thing: never trade scared, always trade gross.',
    ],
  },
]

// Alias for backwards compatibility if needed elsewhere
export const GROSS_BROS = GROSS_BROS_LITE;

export function getDeterministicStats(tokenId: string) {
  const n = parseInt(tokenId) || 0
  return {
    chaos: 40 + (n % 60),
    slime: 50 + ((n * 7) % 50),
    loyalty: 60 + ((n * 13) % 40),
    degeneracy: 30 + ((n * 17) % 70),
  }
}

/**
 * Browser-safe hex to UTF8 parser (replaces Buffer for client-side compat)
 */
function hexToUtf8(hex: string): string {
  if (!hex) return ''
  try {
    const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])
    return new TextDecoder().decode(bytes)
  } catch (e) {
    return ''
  }
}

export function resolveBro(rawNft: any): GrossBro {
  const tokenId = parseInt(rawNft.NFTokenID.slice(-8), 16).toString()
  const cached = GROSS_BROS_LITE.find(b => b.tokenId === tokenId)
  if (cached) return cached

  // Resolve metadata from URI (Hex)
  let metadata: any = {}
  try {
    const hex = rawNft.URI || ''
    const uri = hexToUtf8(hex)
    // Simplified: check if it's IPFS
    const ipfsHash = uri.replace('ipfs://', '').replace('https://ipfs.io/ipfs/', '')
    // In a real app we'd fetch this, but for dynamic fallback we generate from traits if available
    // or use deterministic defaults
  } catch (e) {}

  const stats = getDeterministicStats(tokenId)
  const name = `Gross Bros #${tokenId}`
  
  // Deterministic fallback identity
  return {
    tokenId,
    name,
    image: `https://ipfs.io/ipfs/QmS8P1yXm7S7G3wP5y8Jp4YmZz6Xn8N9K6L7M8R9Q0P1O2/gross-bro-${tokenId}.png`, // Example IPFS path pattern
    species: 'Unclassified Mutant',
    faction: 'Deep Space Drifters',
    traits: [],
    stats,
    tagline: 'Surviving the Ledger, one block at a time.',
    backstory: 'A mysterious survivor of the XRP-7 disaster whose files were corrupted during the mining facility meltdown.',
    systemPrompt: `You are ${name}, a survivor of the XRP-7 cosmic wreckage. You speak with raw, gritty, alien energy. Keep replies short and gross.`,
    demoReplies: [
      'The void is loud today, holder. I am listening.',
      'Bot engaged. I follow the slime trails to the gains.',
      'Status: All systems functional, barely. Standing by.',
    ]
  }
}
