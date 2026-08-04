import { NextResponse } from 'next/server';
import { getBotWalletAddress } from '@/app/lib/botWallet';

/** Simple command detection for the Trade Bot persona */
function detectBotCommand(message: string): string | null {
  const lower = message.toLowerCase().trim();
  if (/\b(snipe|sniper)\b/.test(lower)) return 'snipe';
  if (/\bcopy trade\b/.test(lower)) return 'copy';
  if (/\bstart autopilot\b/.test(lower)) return 'autopilot';
  if (/\bemergency stop\b/.test(lower)) return 'stop';
  return null;
}

/** Mock evaluation – in a real system this would hook into AMM data, signal providers, etc. */
function evaluateBotCommand(command: string, nftId: string): string {
  switch (command) {
    case 'snipe':
      return `🚀 Snipe initiated for NFT ${nftId}. Monitoring low‑liquidity pools...`;
    case 'copy':
      return `📋 Copy‑trade enabled for NFT ${nftId}. Mirroring top trader rWallet...`;
    case 'autopilot':
      return `🤖 Autopilot mode engaged for NFT ${nftId}. Trades will be executed automatically based on market signals.`;
    case 'stop':
      return `🛑 Autopilot halted for NFT ${nftId}. Manual control restored.`;
    default:
      return 'Command not recognized.';
  }
}

export async function POST(request: Request) {
  try {
    const { nftId, ownerAddress, message } = await request.json();
    if (!nftId || !ownerAddress || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Determine if the NFT has an activated bot wallet
    const botAddress = await getBotWalletAddress(nftId);
    const isBotActive = !!botAddress;

    if (isBotActive) {
      const cmd = detectBotCommand(message);
      if (cmd) {
        const reply = evaluateBotCommand(cmd, nftId);
        return NextResponse.json({ bot: true, reply });
      }
    }

    // Fallback – forward to standard LLM (placeholder)
    // In production this would call OpenRouter or another LLM endpoint.
    const placeholder = `🧠 (standard LLM) You said: "${message}"`;
    return NextResponse.json({ bot: false, reply: placeholder });
  } catch (e: any) {
    console.error('chat route error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
