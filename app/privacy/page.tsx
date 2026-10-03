import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 sm:py-14">
      <article className="max-w-3xl mx-auto">
        <Link href="/" className="text-xs font-semibold text-sky-300 hover:text-sky-200 underline underline-offset-4">
          ← Back to SHIFT
        </Link>

        <p className="mt-8 text-[11px] font-mono uppercase tracking-[0.15em] text-sky-300">Privacy & memory</p>
        <h1 className="text-3xl sm:text-4xl font-bold mt-2">What SHIFT remembers, and when.</h1>
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300">
          SHIFT is designed to carry forward compact learning rather than repeatedly replaying a person’s full story. New reflections are session-only by default. Durable account memory is created only through features that clearly ask the user to remember or import something.
        </p>

        <div className="mt-8 space-y-4">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
            <h2 className="text-lg font-semibold">Device-local records</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Reflection history, predictions, practice progress, and other working data can be stored in this browser so the app remains useful without an account. Clearing browser storage or using SHIFT’s deletion controls can remove device-local records.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
            <h2 className="text-lg font-semibold">Signed-in account memory</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              When a user signs in with ChatGPT, the hosted Site receives the authenticated email address and may receive the profile name. SHIFT uses that authenticated identity to keep one person’s records separate from another person’s records. If the hosting runtime does not provide a separate opaque user identifier, SHIFT derives a one-way SHA-256 account key from the normalized email address instead of using the email address itself as the database primary key.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
            <h2 className="text-lg font-semibold">What becomes reusable learning</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              SHIFT preferentially remembers compact items such as a user-confirmed boundary, preference, updated perspective, tested outcome, rejected hypothesis, or strategy the user later reported was helpful. An AI suggestion does not become a fact merely because SHIFT generated it, and advice does not become a “helpful strategy” until the user reports a real-world result that supports that label.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
            <h2 className="text-lg font-semibold">Imported source files</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Full personal-history import has one approval for the complete report. SHIFT stores all extracted plain text privately in your account, including names, relationships and reported events. The report is indexed for search using SHIFT’s AI provider; relevant quoted passages can then be sent to that provider automatically in future reflections and chats. SHIFT does not send the entire report with every message. Reported history, interpretations and historical diagnostic labels retain their qualifications. You can stop retrieval, add or remove personal updates, or delete the source under Memory. Smaller compact learning entries still have an optional individual-review path, and visit/device excerpts remain separate. Source history is not merged into professional-learning records.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
            <h2 className="text-lg font-semibold">When an AI model is used</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              When server-side AI is available, a reflection or chat can include your current situation, relevant compact learning and relevant passages from an approved full-history report. History indexing can send report passages to the embedding provider once; subsequent chats use selected passages. If indexing is unavailable, lexical search can still retrieve history. Failed history loading is disclosed, and unavailable model service does not invent knowledge of your account.
            </p>
          </section>

          <section className="rounded-2xl border border-sky-500/25 bg-sky-950/20 p-5">
            <h2 className="text-lg font-semibold text-sky-200">You can inspect and remove memory</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              The Memory screen shows reusable account learning and private imported sources. Individual learning records can be removed from future personalization. Each new SHIFT breakdown can also show which compact historical learning was considered, so personalization is not meant to operate as a hidden profile.
            </p>
          </section>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate-500">
          SHIFT is an educational reflection and skills-practice product, not a diagnostic, crisis, or medical-treatment service. Avoid entering information you do not want processed by the application.
        </p>
      </article>
    </main>
  );
}
