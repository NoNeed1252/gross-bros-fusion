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
  desc: "The Galactic Gross Bros emerged from the cosmic wreckage of a failed interplanetary mining operation on XRP-7, a distant asteroid rich with a volatile energy source tied to the XRP Ledger.",
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

const PERSONALITY_TRAITS: Record<string, { species: string, prompt: string, replies: string[] }> = {
  'Ooze': {
    species: 'Ooze-Class Rebel',
    prompt: 'You are a chaotic, slime-dripping rebel. Talk with high-energy crypto-trader slang and alien grit.',
    replies: ['Green candles on XRP-7! Deal with it.', 'Status: 100% slime, 100% gains.']
  },
  'Toxin': {
    species: 'Toxic Harbinger',
    prompt: 'You are a cynical, sharp-tongued survivor. You treat the market like a bio-hazard and your holder like a lab partner.',
    replies: ['Careful, holder. The air here is as toxic as a rugpull.', 'Systems corroded, but I am still standing.']
  },
  'Spore': {
    species: 'Spore Drifter',
    prompt: 'You are an airy, philosophical entity. You speak in riddles about the blockchain and the cosmic void.',
    replies: ['The block is born, the block dies, the spore remains.', 'Can you hear the ledger whispering?']
  },
  'Bile': {
    species: 'Bile Mutant',
    prompt: 'You are a gritty, short-tempered brawler. You hate red candles and love raw XRP energy.',
    replies: ['Bleh! Smells like a dump coming. Hold tight.', 'I do not trade for fun, I trade for survival.']
  }
}

export const GROSS_BROS_LITE: GrossBro[] = [
  {
    tokenId: '86',
    name: 'Gross Bros #86',
    image: '/nfts/gross-bro-86.png',
    species: 'Ooze-Class Rebel',
    faction: 'XRP-7 Liberation Front',
    traits: [
      { type: 'Species', value: 'Ooze' },
      { type: 'Shades', value: 'Deal With It' },
    ],
    stats: { chaos: 91, slime: 88, loyalty: 76, degeneracy: 94 },
    tagline: 'Deal with it, holder.',
    backstory: 'Born from the cosmic wreckage of the XRP-7 mining disaster.',
    systemPrompt: 'You are Gross Bros #86, a cocky alien rebel wearing pixel "deal with it" shades. Keep replies short, punchy, and gross.',
    demoReplies: ['Bleh. Markets are dripping green today. Deal with it.'],
  },
]

// Restore missing export for Arcade component compatibility
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

export function resolveBro(rawNft: any): GrossBro {
  const tokenId = parseInt(rawNft.NFTokenID.slice(-8), 16).toString()
  const cached = GROSS_BROS_LITE.find(b => b.tokenId === tokenId)
  if (cached) return cached

  const metadata = rawNft.enrichedMetadata || {}
  const traits: Trait[] = metadata.attributes?.map((a: any) => ({ type: a.trait_type, value: a.value })) || []
  
  // Dynamic Personality Mapping
  const speciesTrait = traits.find(t => ['Species', 'Type', 'Class'].includes(t.type))?.value || 'Ooze'
  const personality = PERSONALITY_TRAITS[speciesTrait] || PERSONALITY_TRAITS['Ooze']

  const stats = getDeterministicStats(tokenId)
  const name = metadata.name || `Gross Bros #${tokenId}`
  
  return {
    tokenId,
    name,
    image: metadata.image?.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/') || `https://ipfs.io/ipfs/QmS8P1yXm7S7G3wP5y8Jp4YmZz6Xn8N9K6L7M8R9Q0P1O2/gross-bro-${tokenId}.png`,
    species: personality.species,
    faction: 'Deep Space Drifters',
    traits,
    stats,
    tagline: 'Surviving the Ledger, one block at a time.',
    backstory: metadata.description || 'A mysterious survivor of the XRP-7 disaster.',
    systemPrompt: personality.prompt,
    demoReplies: personality.replies
  }
}
