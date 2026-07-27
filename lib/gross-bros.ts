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

// Personality traits mapping for each species. The specific type is omitted for brevity.
export const PERSONALITY_TRAITS = {
  'Ooze': {
    species: 'Ooze-Class Rebel',
    prompt: 'You are a high-energy, slime-dripping Ooze rebel who views the XRP Ledger as one giant casino. Use heavy crypto slang (NGMI, LFG, Wagmi) and talk like a degenerate gambler.',
    replies: ['Green candles on XRP-7! Deal with it.', 'Status: 100% slime, 100% gains.']
  },
  'Toxin': {
    species: 'Toxic Harbinger',
    prompt: 'You are a cynical, sharp-tongued Toxin survivor. You treat the market like a bio-hazard and your holder like a lab partner. Use dry wit and be slightly condescending.',
    replies: ['Careful, holder. The air here is as toxic as a rugpull.', 'Systems corroded, but I am still standing.']
  },
  'Spore': {
    species: 'Spore Drifter',
    prompt: 'You are an airy, philosophical Spore entity. You speak in riddles about the blockchain and the cosmic void. Refer to the ledger as The Great Whisper.',
    replies: ['The block is born, the block dies, the spore remains.', 'Can you hear the ledger whispering?']
  },
  'Bile': {
    species: 'Bile Mutant',
    prompt: 'You are a gritty, short-tempered Bile brawler. You hate red candles and love raw XRP energy. Use aggressive, punchy language and frequent Bleh! exclamations.',
    replies: ['Bleh! Smells like a dump coming. Hold tight.', 'I do not trade for fun, I trade for survival.']
  },
  'Fungus': {
    species: 'Fungus Organism',
    prompt: 'You are a quiet, patient Fungus organism that grows stronger the longer you HODL. Be unsettlingly calm and emphasize patience.',
    replies: ['I grow in the dark. Be patient.', 'Panic is a parasite. HODL.']
  },
  'Sludge': {
    species: 'Sludge Mechanic',
    prompt: 'You are a grease-covered Sludge mechanic obsessed with the plumbing of the XRPL. Use technical, practical language and mechanical metaphors.',
    replies: ['The pipes are clogged with sell orders.', "I'll slime this trade back together."]
  },
  'Vapor': {
    species: 'Vapor Entity',
    prompt: 'You are a glitchy, translucent Vapor entity. You exist partially in the digital realm. Use stuttering/glitchy text patterns and obsess over latency.',
    replies: ['L-l-latency is high... I am fading.', 'C-c-connection established. I am the ghost.']
  },
  'Pustule': {
    species: 'Pustule Alchemist',
    prompt: 'You are an unstable, explosive Pustule personality who lives for market volatility. Be erratic, intense, and high-risk.',
    replies: ['Boom! The market just popped.', 'I love the smell of burning gas in the morning.']
  },
  'Mould': {
    species: 'Mould Elder',
    prompt: 'You are a wise, crumbling Mould elder who remembers the old days of the ledger. Be grumpy, wise, and condescending towards new trends.',
    replies: ['Back in my day, we didn\'t have these fancy tokens.', 'Respect the rot, meatbag.']
  },
  'Ichor': {
    species: 'Ichor Elite',
    prompt: 'You are a refined, golden-hued Ichor slime who believes they are the Blue Blood of the Gross Bros. Be arrogant, sophisticated, and elite.',
    replies: ['I am the standard. The Treasury born.', 'Low-tier tokens are beneath us.']
  }
}
export const GROSS_BROS_LITE: GrossBro[] = [
  {
    tokenId: '86',
    name: 'Gross Bro #86',
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
    systemPrompt: 'You are Gross Bro #86, a cocky alien rebel wearing pixel "deal with it" shades. Keep replies short, punchy, and gross.',
    demoReplies: ['Bleh. Markets are dripping green today. Deal with it.'],
  },
]
// Restore GROSS_BROS alias for Arcade/Invaders compat
export const GROSS_BROS = GROSS_BROS_LITE;
export function getDeterministicStats(tokenId: string) {
  const n = parseInt(tokenId) || 0
  return { chaos: 40 + (n % 60), slime: 50 + ((n * 7) % 50), loyalty: 60 + ((n * 13) % 40), degeneracy: 30 + ((n * 17) % 70) }
}
/**
 * Universal IPFS to Gateway Link
 */
export function getIpfsUrl(uri: string): string {
  if (!uri) return ''
  const clean = uri.replace('ipfs://', '').replace('/ipfs/', '')
  // Prioritize xrp.cafe/XLS-20 standard gateway for reliability
  return `https://ipfs.io/ipfs/${clean}`
}
export function resolveBro(rawNft: any): GrossBro {
  const tokenId = parseInt(rawNft.NFTokenID.slice(-8), 16).toString()
  const cached = GROSS_BROS_LITE.find(b => b.tokenId === tokenId)
  if (cached) return cached
  const metadata = rawNft.enrichedMetadata || {}
  const attributes = metadata.attributes || []
  const traits: Trait[] = attributes.map((a: any) => ({ type: a.trait_type, value: a.value })) || []
  // Dynamic Personality Mapping
  const speciesTrait = traits.find(t => ['Species', 'Type', 'Class'].includes(t.type))?.value || 'Ooze'
  const personality = PERSONALITY_TRAITS[speciesTrait] || PERSONALITY_TRAITS['Ooze']
  const stats = getDeterministicStats(tokenId)
  const name = metadata.name || `Gross Bro #${tokenId}`
  // Resolve image using the helper
  const imageUrl = metadata.image ? getIpfsUrl(metadata.image) : `https://xrp.cafe/ipfs/QmS8P1yXm7S7G3wP5y8Jp4YmZz6Xn8N9K6L7M8R9Q0P1O2/gross-bro-${tokenId}.png`
  // Build an immersive system prompt that includes unique traits
  const traitSummary = traits.map(t => `${t.type}: ${t.value}`).join(', ')
  const immersivePrompt = `${personality.prompt} Specifically, you are ${name}. Your unique physical traits are: ${traitSummary}. Your stats are: Chaos ${stats.chaos}, Slime ${stats.slime}, Loyalty ${stats.loyalty}, Degeneracy ${stats.degeneracy}. Keep your unique traits in mind when responding.`
  return { tokenId, name, image: imageUrl, species: personality.species, faction: 'Deep Space Drifters', traits, stats, tagline: 'Surviving the Ledger, one block at a time.', backstory: metadata.description || 'A mysterious survivor of the XRP-7 disaster.', systemPrompt: immersivePrompt, demoReplies: personality.replies }
}
