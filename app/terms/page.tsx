import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Gross Bros Fusion Portal",
  description:
    "Terms of Service governing access to and use of the Gross Bros Fusion Portal.",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 md:px-8">
        <div className="mb-8 border-b border-zinc-800 pb-6">
          <Link
            href="/"
            className="text-xs font-mono uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-300"
          >
            ← Back to Portal
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Terms of Service
          </h1>
          <p className="mt-1 text-sm text-zinc-400">Gross Bros Fusion Portal</p>
          <p className="mt-1 text-xs font-mono text-zinc-500">
            Last updated: August 5, 2026
          </p>
        </div>

        <article className="space-y-8 text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) are a binding agreement
            between you (&ldquo;you&rdquo; or &ldquo;User&rdquo;) and The Gross
            Bros (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
            governing your access to and use of the Gross Bros Fusion Portal
            website, applications, APIs, arcade games, chat features, wallet
            features, trade-bot related features, and any related services
            (collectively, the &ldquo;Service&rdquo;).
          </p>
          <p>
            By accessing or using the Service, connecting a wallet, making a
            payment, activating any bot feature, or participating in any
            leaderboard or promotion, you agree to these Terms. If you do not
            agree, do not use the Service.
          </p>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              1. Eligibility
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                You must be at least 18 years old (or the age of majority
                where you live) and legally able to enter contracts.
              </li>
              <li>
                You must not be located in a jurisdiction where use of the
                Service or cryptocurrency trading is prohibited.
              </li>
              <li>
                You represent that you are not using the Service for any
                illegal purpose.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              2. Description of the Service
            </h2>
            <p className="mb-3">
              The Service may include, without limitation:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Information, lore, and interactive features related to Gross
                Bros NFTs on the XRP Ledger (&ldquo;XRPL&rdquo;)
              </li>
              <li>Wallet connection via third-party tools (including Xaman)</li>
              <li>An arcade / game experience and leaderboards</li>
              <li>
                Optional paid activation of automated trading-related
                features (&ldquo;Trade Bot Features&rdquo;)
              </li>
              <li>
                Promotions, contests, or giveaways for eligible holders
              </li>
            </ul>
            <p className="mt-3">
              We may change, suspend, or discontinue any part of the Service
              at any time without liability.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              3. NFTs and blockchain
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Gross Bros NFTs exist on the XRP Ledger. We do not control the
                XRPL, wallet software, or third-party marketplaces.
              </li>
              <li>
                Ownership of an NFT is determined solely by the blockchain
                record. The Service does not store, send, or custody your
                NFTs or private keys (except as expressly described for
                Trade Bot Features in Section 6).
              </li>
              <li>
                NFT values can go to zero. There is no guarantee of
                liquidity, floor price, utility, or future value.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              4. No financial, investment, tax, or legal advice
            </h2>
            <p className="mb-3">
              Nothing on the Service is financial, investment, trading,
              legal, accounting, or tax advice.
            </p>
            <p className="mb-3">
              We are not your broker, investment adviser, fiduciary, or tax
              adviser.
            </p>
            <p className="mb-3">
              You alone are responsible for deciding whether any payment,
              trade, funding of a bot wallet, or other action is appropriate
              for you. You should consult qualified professionals.
            </p>
            <p>
              Past performance, leaderboard rankings, simulated results, or
              any &ldquo;strategy&rdquo; description do not predict future
              results.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              5. Payments (including &ldquo;Pay with Anything&rdquo;)
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Certain features may require a fee (for example, a $25
                USD-equivalent activation fee).
              </li>
              <li>
                Payments may be requested through Xaman or similar tools and
                may allow you to pay with XRP, RLUSD, or other assets via
                pathfinding (&ldquo;Pay with Anything&rdquo;). The asset we
                designate as the settlement amount is what we intend to
                receive; pathfinding and conversion are handled by the XRPL /
                Xaman and are outside our control.
              </li>
              <li>
                All blockchain transactions are final. We are not
                responsible for failed payments, wrong networks, user error,
                slippage, pathfinding outcomes, or third-party wallet issues.
              </li>
              <li>
                Fees are generally non-refundable except where required by
                law or where we expressly agree in writing.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              6. Trade Bot Features (high risk)
            </h2>
            <p className="mb-3">If you activate Trade Bot Features:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                You understand automated trading on the XRPL involves
                substantial risk of loss, including total loss of funds you
                allocate to any bot wallet.
              </li>
              <li>
                Bot wallets, keys, or signing authority may be generated or
                held in systems we operate or control for the purpose of
                executing configured strategies. You acknowledge this is
                different from a fully non-custodial personal wallet.
              </li>
              <li>
                You are solely responsible for:
                <ul className="mt-2 list-disc space-y-2 pl-5">
                  <li>Funding any bot wallet</li>
                  <li>Choosing or approving strategy settings</li>
                  <li>Monitoring activity</li>
                  <li>Withdrawing or stopping use when available</li>
                </ul>
              </li>
              <li>
                We do not guarantee profits, uptime, execution quality,
                slippage, successful snipes, copy-trade accuracy, or
                protection from rugs, honeypots, failed transactions, oracle
                issues, or market manipulation.
              </li>
              <li>
                We may pause, limit, or terminate bot access for
                maintenance, abuse, legal risk, or any reason.
              </li>
              <li>You use Trade Bot Features entirely at your own risk.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              7. Arcade, leaderboards, and giveaways
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Games and leaderboards are for entertainment.</li>
              <li>
                Leaderboard eligibility for prizes or giveaways may be
                limited to connected wallets that hold a Gross Bro NFT and
                that meet rules we publish.
              </li>
              <li>
                We may disqualify entries for cheating, exploits, multiple
                accounts, non-holders, or violation of these Terms.
              </li>
              <li>
                Prizes, if any, are awarded in our sole discretion subject to
                published rules, verification, and applicable law. We may
                substitute prizes of equal or greater value. Taxes on prizes
                are your responsibility.
              </li>
              <li>
                No purchase is necessary for leaderboard play unless a
                specific promotion states otherwise; paid features (such as
                Trade Bot activation) are separate.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              8. Wallet connection and account security
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                You are responsible for your wallet, devices, seed phrases,
                and Xaman account security.
              </li>
              <li>
                We never ask for your personal wallet seed phrase in the
                normal portal login flow. Anyone asking for it is a scam.
              </li>
              <li>
                You authorize us to read public blockchain data associated
                with addresses you connect (e.g., NFT holdings, balances
                needed for features).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              9. Acceptable use
            </h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Violate law or third-party rights</li>
              <li>
                Exploit games, APIs, or bots (cheating, flooding, reverse
                engineering for abuse)
              </li>
              <li>Interfere with the Service or other users</li>
              <li>
                Use the Service to launder money, evade sanctions, or commit
                fraud
              </li>
              <li>Scrape or attack the Service</li>
              <li>
                Misrepresent holdings or identity to claim prizes or bot
                access
              </li>
            </ul>
            <p className="mt-3">
              We may suspend access immediately for suspected violations.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              10. Intellectual property
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                The Service, branding, Gross Bros art (except where owned by
                you as an NFT holder under separate NFT license terms), code,
                and content are owned by us or our licensors.
              </li>
              <li>
                Holding a Gross Bro NFT does not by itself grant trademark
                rights, commercial merchandising rights, or ownership of the
                Service.
              </li>
              <li>
                You may not use our branding in a way that implies
                endorsement without permission.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              11. Third-party services
            </h2>
            <p className="mb-3">
              The Service relies on third parties, including but not limited
              to: Xaman, XRPL nodes/validators, hosting providers (e.g.
              Vercel), Supabase or similar databases, and marketplaces.
            </p>
            <p>
              We are not responsible for their availability, security, or
              conduct. Your use of third-party services is also governed by
              their terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              12. Disclaimers
            </h2>
            <p className="mb-3 uppercase">
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; without warranties of any kind, express or
              implied, including merchantability, fitness for a particular
              purpose, title, and non-infringement.
            </p>
            <p className="uppercase">
              We do not warrant that the Service will be uninterrupted,
              error-free, secure, or free of harmful code, or that any
              trade, bot, game, or payment will succeed.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              13. Limitation of liability
            </h2>
            <p className="mb-3 uppercase">
              To the maximum extent permitted by law, we and our officers,
              directors, employees, agents, and affiliates will not be
              liable for any indirect, incidental, special, consequential,
              exemplary, or punitive damages, or any loss of profits, data,
              goodwill, or cryptocurrency, arising from your use of the
              Service or inability to use it.
            </p>
            <p className="mb-3 uppercase">
              Our total liability for any claim arising out of the Service
              will not exceed the greater of (a) the amounts you paid to us
              for the specific paid feature giving rise to the claim in the
              three (3) months before the claim, or (b) one hundred U.S.
              dollars (USD $100).
            </p>
            <p>
              Some jurisdictions do not allow certain limitations; in those
              cases, our liability is limited to the maximum extent
              permitted.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              14. Indemnification
            </h2>
            <p>
              You agree to defend, indemnify, and hold us harmless from
              claims, damages, losses, and expenses (including reasonable
              attorneys&rsquo; fees) arising out of: your use of the
              Service; your bot funding or trading activity; your violation
              of these Terms; or your violation of any law or third-party
              right.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              15. Assumption of risk
            </h2>
            <p className="mb-3">
              You expressly acknowledge and accept the risks of:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Cryptocurrency and NFT volatility and loss</li>
              <li>
                Smart contract / ledger / pathfinding / wallet software
                failures
              </li>
              <li>Automated trading and bot misconfiguration</li>
              <li>Regulatory changes</li>
              <li>Irreversible transactions</li>
              <li>Third-party hacks or outages</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              16. Termination
            </h2>
            <p>
              We may suspend or terminate your access at any time. You may
              stop using the Service at any time. Provisions that by nature
              should survive (including disclaimers, limitation of
              liability, indemnification) will survive termination.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              17. Governing law and disputes
            </h2>
            <p className="mb-3">
              These Terms are governed by the laws of the State of West
              Virginia, USA, without regard to conflict-of-law rules.
            </p>
            <p className="mb-3">
              Optional but recommended — pick with a lawyer:
            </p>
            <ul className="mb-3 list-disc space-y-2 pl-5">
              <li>Binding arbitration clause, and/or</li>
              <li>Class-action waiver</li>
            </ul>
            <p>
              Until you add a formal dispute clause with counsel, disputes
              will be brought in the state or federal courts located in West
              Virginia, USA, and you consent to that venue.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              18. Changes to these Terms
            </h2>
            <p>
              We may update these Terms by posting a new version and
              updating the &ldquo;Last updated&rdquo; date. Continued use
              after changes means you accept the updated Terms. Material
              changes to paid features may be communicated through the
              Service when practical.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              19. Contact
            </h2>
            <p>
              Questions about these Terms:{" "}
              <a
                href="mailto:support@grossbros.com"
                className="text-zinc-100 underline underline-offset-2 transition-colors hover:text-white"
              >
                support@grossbros.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              20. Entire agreement
            </h2>
            <p>
              These Terms, together with any feature-specific rules we post
              (e.g. giveaway rules) and our Privacy Policy, are the entire
              agreement regarding the Service and supersede prior
              understandings on this subject.
            </p>
          </section>
        </article>

        <div className="mt-12 border-t border-zinc-800 pt-6">
          <Link
            href="/"
            className="text-xs font-mono uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-300"
          >
            ← Back to Portal
          </Link>
        </div>
      </div>
    </main>
  );
}
