import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Gross Bros Fusion Portal",
  description:
    "Privacy Policy describing how The Gross Bros collects, uses, and safeguards information in connection with the Gross Bros Fusion Portal.",
};

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-1 text-sm text-zinc-400">Gross Bros Fusion Portal</p>
          <p className="mt-1 text-xs font-mono text-zinc-500">
            Last updated: August 5, 2026
          </p>
        </div>

        <div className="mb-10 border-2 border-zinc-700 bg-zinc-900 p-5 sm:p-6">
          <p className="mb-3 text-xs font-mono uppercase tracking-widest text-zinc-400">
            Zero-Knowledge Guarantee — Read First
          </p>
          <ul className="list-disc space-y-3 pl-5 text-sm font-semibold text-zinc-100 sm:text-[15px]">
            <li>
              We NEVER request, collect, transmit, or store your private keys,
              seed phrases, or wallet security credentials. This guarantee is
              absolute and non-negotiable and admits no exception.
            </li>
            <li>
              We read ONLY your public wallet address and the NFT metadata
              strictly necessary to operate the Arcade leaderboard and
              scoring mechanism. No other personal data is read from your
              wallet.
            </li>
            <li>
              Our Trade Bot Features capture ZERO user information,
              transactional history, or strategic data outside of the direct
              execution of the designated on-chain automated strategy you
              configure. Bot operations are strictly isolated.
            </li>
          </ul>
        </div>

        <article className="space-y-8 text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
          <p>
            This Privacy Policy (&ldquo;Policy&rdquo;) describes how The Gross
            Bros (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
            collects, uses, discloses, and safeguards information in
            connection with the Gross Bros Fusion Portal website,
            applications, arcade games, leaderboards, wallet-connection
            features, Trade Bot Features, and any related services
            (collectively, the &ldquo;Service&rdquo;). This Policy is
            incorporated into and should be read together with our Terms of
            Service.
          </p>
          <p>
            By accessing or using the Service, connecting a wallet,
            activating any Trade Bot Feature, or participating in any arcade
            or leaderboard feature, you acknowledge that you have read and
            understood this Policy. If you do not agree with this Policy,
            you must discontinue use of the Service.
          </p>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              1. Zero-Knowledge Guarantees
            </h2>
            <p className="mb-3">
              The following guarantees are absolute, binding, and control
              over any conflicting or ambiguous provision elsewhere in this
              Policy or in any other communication.
            </p>
            <p className="mb-2 font-semibold text-zinc-100">
              (a) Zero seed phrase / private key collection
            </p>
            <ul className="mb-3 list-disc space-y-2 pl-5">
              <li>
                Under no circumstances does the Service request, collect,
                transmit, log, cache, or store your personal wallet private
                keys, seed phrases, mnemonic recovery phrases, or any other
                wallet security credential, whether entered directly,
                autofilled, pasted, photographed, or transmitted by any other
                means.
              </li>
              <li>
                This prohibition is absolute and non-negotiable. It applies
                to us, our personnel, our service providers, and any system
                we operate, without exception, and cannot be waived by any
                feature, promotion, support interaction, or future update
                short of a fundamental restructuring of the Service disclosed
                to you in a revised Policy.
              </li>
              <li>
                Any person or interface purporting to request your seed
                phrase or private key on behalf of the Service is
                fraudulent and not authorized by us.
              </li>
            </ul>
            <p className="mb-2 font-semibold text-zinc-100">
              (b) Wallet-only interaction
            </p>
            <ul className="mb-3 list-disc space-y-2 pl-5">
              <li>
                The Service reads only your public wallet address and the
                NFT metadata strictly necessary to operate the Arcade
                leaderboard and scoring mechanism (for example, confirming
                Gross Bro NFT ownership for leaderboard eligibility).
              </li>
              <li>
                No other personal data or telemetry is collected from your
                wallet or wallet session beyond the public address and NFT
                metadata described above. Section 3 describes the separate,
                minimal, non-wallet-linked technical logs necessary to
                operate the underlying web infrastructure.
              </li>
            </ul>
            <p className="mb-2 font-semibold text-zinc-100">
              (c) Trade Bot zero-data policy
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                For the Trade Bot Features, zero user information,
                transactional history, or strategic data is captured,
                harvested, logged, or transmitted outside of the direct,
                real-time execution of the designated on-chain automated
                strategy you configure.
              </li>
              <li>
                Trade Bot operations are strictly isolated to the execution
                pathway required to sign and broadcast the configured
                strategy&rsquo;s transactions on the XRPL. No user
                information, trade history, or strategy configuration is
                compiled, aggregated, profiled, or retained by us beyond what
                is technically required, transiently, to execute that
                specific transaction.
              </li>
              <li>
                Section 6 sets out the full Trade Bot Zero-Data Policy in
                detail.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              2. Non-custodial nature of the Service
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                The Service is, except where expressly stated otherwise for
                optional Trade Bot Features under our Terms of Service and
                Section 6 of this Policy, non-custodial. We do not take
                possession of, store, or have access to your private keys,
                seed phrases, or the contents of your personal wallet.
              </li>
              <li>
                Wallet connections are facilitated through third-party
                infrastructure, including the XRP Ledger (&ldquo;XRPL&rdquo;)
                and the Xaman wallet application. Authentication and
                transaction signing occur within that third-party
                environment and outside of our systems.
              </li>
              <li>
                We have no ability to reverse, freeze, recover, or otherwise
                control any transaction you sign or broadcast on the XRPL. Any
                data we receive from a wallet connection is limited to
                information that is either publicly available on the
                distributed ledger or affirmatively and voluntarily shared by
                you through the connection interface, and, in all cases, is
                limited as described in Section 1(b) above.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              3. Information we collect
            </h2>
            <p className="mb-3">
              We collect the categories of information described below.
            </p>
            <p className="mb-2 font-semibold text-zinc-100">
              (a) Public blockchain information (wallet-only interaction)
            </p>
            <ul className="mb-3 list-disc space-y-2 pl-5">
              <li>
                The public wallet address you connect to the Service, and the
                NFT metadata strictly necessary to verify Gross Bro NFT
                ownership for Arcade leaderboard eligibility and scoring, as
                described in Section 1(b).
              </li>
              <li>
                We do not read, request, or store any other information from
                your wallet, including balances, full transaction history, or
                holdings unrelated to Gross Bro NFT verification, except to
                the limited extent independently and voluntarily disclosed by
                you.
              </li>
              <li>
                Because a public wallet address and associated on-chain NFT
                metadata are recorded on a public, permissionless, distributed
                ledger, this information is not private and may be
                independently accessed, viewed, or analyzed by any third
                party, irrespective of any action taken by us.
              </li>
            </ul>
            <p className="mb-2 font-semibold text-zinc-100">
              (b) Minimal, non-wallet-linked technical logs
            </p>
            <ul className="mb-3 list-disc space-y-2 pl-5">
              <li>
                Basic infrastructure logs generated by our hosting provider in
                the ordinary course of serving the Service (for example,
                request timestamps and coarse, city/region-level location
                inferred from IP address) that are necessary to operate,
                secure, and diagnose the Service.
              </li>
              <li>
                These infrastructure logs are not linked to your wallet
                address, are not used to build a profile of you, and are not
                the &ldquo;telemetry&rdquo; excluded by the Zero-Knowledge
                Guarantee in Section 1(b), which concerns data read from your
                wallet specifically.
              </li>
              <li>
                We do not knowingly collect precise geolocation, biometric
                identifiers, government identification numbers, or financial
                account credentials.
              </li>
            </ul>
            <p className="mb-2 font-semibold text-zinc-100">
              (c) Gameplay and session data (Arcade &amp; Leaderboards)
            </p>
            <ul className="mb-3 list-disc space-y-2 pl-5">
              <li>
                Gameplay session information, in-game scores, session tokens,
                and preference data necessary to operate arcade features and
                maintain a session across page loads.
              </li>
              <li>
                Leaderboard entries, including a submitted score and an
                associated public wallet address or display handle, where you
                choose to participate in a leaderboard.
              </li>
            </ul>
            <p className="mb-2 font-semibold text-zinc-100">
              (d) Information you voluntarily provide
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Any information you submit directly to us, including through
                support correspondence sent to support@grossbros.com.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              4. Cookies and local storage
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                We use cookies, browser local storage, and similar
                technologies to maintain gaming sessions within the Arcade,
                persist leaderboard-related state, remember basic display
                preferences, and support the general functioning and security
                of the Service.
              </li>
              <li>
                These technologies are used for functional and analytical
                purposes only. We do not use cookies or local storage to sell
                information about you or to serve third-party targeted
                advertising.
              </li>
              <li>
                Most browsers allow you to control or delete cookies and
                local storage through their settings. Disabling these
                technologies may degrade or disable arcade, session, or
                leaderboard functionality.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              5. Database storage (Supabase)
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                We use Supabase, a third-party database and backend
                infrastructure provider, to store certain data necessary to
                operate the Service, including arcade scores and leaderboard
                entries associated with a connected public wallet address.
              </li>
              <li>
                Anonymous gameplay, meaning gameplay that occurs without a
                wallet connection or leaderboard submission, is not persisted
                to an identifiable record in our database. We do not
                associate anonymous session activity with a wallet address or
                any other identifier absent an affirmative leaderboard
                submission.
              </li>
              <li>
                Data stored in Supabase is maintained on infrastructure
                operated by Supabase and is subject to Supabase&rsquo;s own
                security practices and policies. We implement
                commercially reasonable administrative and technical
                safeguards to restrict access to stored data to what is
                necessary to operate the Service.
              </li>
              <li>
                Consistent with Section 1(a), no private key, seed phrase, or
                wallet security credential is ever stored in Supabase or any
                other database we operate or use.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              6. Trade Bot Zero-Data Policy
            </h2>
            <p className="mb-3 uppercase">
              This Section governs Trade Bot Features and controls over any
              general statement elsewhere in this Policy to the extent of any
              conflict.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Zero user information, transactional history, or strategic
                data is captured, harvested, logged, aggregated, profiled, or
                transmitted to us or to any third party outside of the
                direct, real-time execution of the designated on-chain
                automated strategy you configure.
              </li>
              <li>
                Trade Bot operations are strictly isolated to the execution
                pathway required to sign and broadcast the configured
                strategy&rsquo;s transactions on the XRPL. Any data that
                transiently passes through that execution pathway (for
                example, the specific order parameters needed to place a
                single trade) is used solely to execute that transaction and
                is not compiled into a user profile, trading history archive,
                or strategic dataset.
              </li>
              <li>
                We do not sell, license, analyze for marketing purposes, or
                otherwise exploit any data associated with your use of Trade
                Bot Features.
              </li>
              <li>
                Where bot wallets, keys, or signing authority are generated or
                held in systems we operate to execute a configured strategy,
                as described in our Terms of Service, that access is limited
                strictly to the automated execution of your configured
                strategy and is not used to read, copy, export, or retain your
                personal wallet&rsquo;s private keys or seed phrase, which
                remain subject to the absolute prohibition in Section 1(a).
              </li>
              <li>
                Nothing in this Section limits our ability to maintain the
                minimal transient technical logs strictly necessary to
                detect, investigate, and prevent fraud, exploits, or abuse of
                Trade Bot Features, or to comply with applicable law.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              7. How we use information
            </h2>
            <p className="mb-3">We use the information described above to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Operate, maintain, and provide the Service, including wallet connection, the Arcade, leaderboard features, and Trade Bot Features.</li>
              <li>Verify eligibility for leaderboard rankings, prizes, or promotions.</li>
              <li>Diagnose, troubleshoot, and improve the technical performance, security, and reliability of the Service.</li>
              <li>Detect, investigate, and prevent fraud, exploits, cheating, and abuse.</li>
              <li>Respond to support inquiries you submit.</li>
              <li>Comply with applicable law, legal process, and regulatory requirements, and enforce our Terms of Service.</li>
            </ul>
            <p className="mt-3">
              We do not use personal information for any purpose beyond the
              utility of the Service and our legal compliance obligations, as
              further described in Section 8 below, and always subject to
              the Zero-Knowledge Guarantees in Section 1.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              8. No sale of personal data
            </h2>
            <p className="mb-3 uppercase">
              We do not sell, rent, or trade personal information to third
              parties for monetary or other valuable consideration.
            </p>
            <p className="mb-3">
              Information collected through the Service is used strictly for
              the utility of the Service, described in Section 7, and to
              satisfy legal, regulatory, and compliance obligations to which
              we are subject. We do not operate a data brokerage, and we do
              not license user data to advertisers, data aggregators, or
              analytics resellers for their independent use.
            </p>
            <p>
              This Section does not restrict our ability to disclose
              information to service providers, successors, or authorities
              as described in Section 9.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              9. Disclosure of information
            </h2>
            <p className="mb-3">
              We may disclose information in the following limited circumstances:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-semibold text-zinc-100">Service providers.</span>{" "}
                To vendors and infrastructure providers that perform services
                on our behalf, including hosting (e.g., Vercel) and database
                services (e.g., Supabase), solely to the extent necessary for
                them to perform those services.
              </li>
              <li>
                <span className="font-semibold text-zinc-100">Legal compliance.</span>{" "}
                Where we believe in good faith that disclosure is required by
                applicable law, regulation, subpoena, court order, or other
                legal process, or to protect the rights, property, or safety
                of The Gross Bros, our users, or the public.
              </li>
              <li>
                <span className="font-semibold text-zinc-100">Corporate transactions.</span>{" "}
                In connection with a merger, acquisition, reorganization, sale
                of assets, or similar transaction, in which case information
                may be transferred as a business asset, subject to
                continuing obligations consistent with this Policy.
              </li>
              <li>
                <span className="font-semibold text-zinc-100">With your consent.</span>{" "}
                Where you have otherwise directed or consented to the
                disclosure.
              </li>
              <li>
                <span className="font-semibold text-zinc-100">Public blockchain data.</span>{" "}
                Any information that is recorded on the public XRPL ledger is
                inherently public and is not subject to disclosure
                restrictions under this Policy.
              </li>
            </ul>
            <p className="mt-3">
              No disclosure under this Section ever includes a private key,
              seed phrase, or wallet security credential, consistent with
              Section 1(a).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              10. Data retention
            </h2>
            <p>
              We retain information for as long as reasonably necessary to
              fulfill the purposes described in this Policy, including to
              operate leaderboards, maintain records for legal compliance and
              dispute resolution, and enforce our agreements. Public
              blockchain data persists on the XRPL independently of our
              systems and is not within our control to delete. We may retain
              limited technical and telemetry data in aggregated or
              de-identified form for analytical purposes without time
              limitation. Trade Bot execution data is retained only as
              described in Section 6.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              11. Data security
            </h2>
            <p>
              We implement commercially reasonable administrative, technical,
              and organizational safeguards designed to protect information
              within our control from unauthorized access, use, alteration,
              or disclosure. No method of electronic storage or transmission
              is completely secure, and we cannot guarantee absolute security.
              You are solely responsible for the security of your own
              wallet, devices, credentials, and Xaman account. Regardless of
              the outcome of any security incident, the Zero-Knowledge
              Guarantees in Section 1 mean there is no private key or seed
              phrase held by us that could be exposed.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              12. Children&rsquo;s privacy
            </h2>
            <p>
              The Service is not directed to, and is not intended for use by,
              individuals under the age of eighteen (18). We do not knowingly
              collect personal information from anyone under eighteen (18).
              If we become aware that we have inadvertently collected such
              information, we will take reasonable steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              13. International users and data transfer
            </h2>
            <p>
              The Service is hosted and operated from the United States. If
              you access the Service from outside the United States, you
              understand that your information may be transferred to,
              stored, and processed in the United States or in other
              jurisdictions where our service providers maintain facilities,
              which may have data protection laws different from those of
              your jurisdiction. By using the Service, you consent to such
              transfer, storage, and processing.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              14. Your choices and rights
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                You may disconnect your wallet from the Service at any time
                through your wallet application; disconnection does not
                remove information already recorded on the public ledger or
                previously submitted to a leaderboard.
              </li>
              <li>
                You may clear cookies and local storage through your browser
                settings, which may reset arcade session state.
              </li>
              <li>
                Depending on your jurisdiction, you may have rights to
                request access to, correction of, or deletion of certain
                personal information we hold about you, subject to
                applicable exceptions (including information that must be
                retained for legal compliance or that is recorded
                immutably on the public blockchain). You may submit such a
                request to support@grossbros.com, and we will respond within
                a reasonable time.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              15. Third-party links and services
            </h2>
            <p>
              The Service may link to, integrate with, or rely upon
              third-party services, including the XRPL, Xaman, Supabase,
              hosting providers, and NFT marketplaces. This Policy does not
              apply to the practices of those third parties, which are
              governed by their own privacy policies. We encourage you to
              review the privacy practices of any third-party service before
              interacting with it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              16. Changes to this Policy
            </h2>
            <p>
              We may update this Policy from time to time by posting a
              revised version and updating the &ldquo;Last updated&rdquo;
              date above. Material changes may be communicated through the
              Service when practical. Your continued use of the Service after
              a revised Policy becomes effective constitutes your acceptance
              of the revised Policy. For the avoidance of doubt, no revision
              will retroactively authorize the collection of a private key or
              seed phrase described as absolutely prohibited in Section 1(a).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              17. Governing law
            </h2>
            <p>
              This Policy, and any dispute arising out of or relating to it
              or to our data practices, is governed by the laws of the State
              of West Virginia, USA, without regard to conflict-of-law
              rules, and, to the extent applicable, is subject to the
              dispute-resolution and venue provisions set forth in our Terms
              of Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              18. Contact us
            </h2>
            <p>
              Questions, requests, or concerns regarding this Policy or our
              data practices may be directed to:{" "}
              <a
                href="mailto:support@grossbros.com"
                className="text-zinc-100 underline underline-offset-2 transition-colors hover:text-white"
              >
                support@grossbros.com
              </a>
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
