import { BookOpenCheck, Brain, ClipboardCheck, Repeat2 } from 'lucide-react';

import { frameworks } from '@/lib/shift';

const pillars = [
  {
    number: '01',
    icon: BookOpenCheck,
    title: 'Learn a usable skill',
    text: 'Therapy introduces a framework and helps you understand when a skill may fit. SHIFT turns that idea into a small, concrete mental move you can rehearse.',
  },
  {
    number: '02',
    icon: Repeat2,
    title: 'Retrieve before you reveal',
    text: 'Each round asks you to produce a response before seeing a cue or example. That effortful retrieval creates a stronger practice opportunity than passively rereading an explanation.',
  },
  {
    number: '03',
    icon: ClipboardCheck,
    title: 'Bring practice back to therapy',
    text: 'Your report records what you tried, how difficult recall felt, and what you want to remember. It gives you and your therapist concrete material to review and refine together.',
  },
];

export function ScienceView() {
  return (
    <section className="view-shell science-page">
      <div className="science-hero">
        <span className="eyebrow">The practice model</span>
        <h1>Learn it. Retrieve it. Use it.</h1>
        <p>SHIFT is designed around a simple idea: psychological skills become more available through repeated, meaningful practice—not by collecting more information.</p>
        <div className="science-loop" aria-label="Learn, retrieve, apply, reflect loop"><span>Learn</span><i>→</i><span>Retrieve</span><i>→</i><span>Apply</span><i>→</i><span>Reflect</span></div>
      </div>

      <div className="pillar-grid">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return <article key={pillar.number}><span>{pillar.number}</span><Icon /><h2>{pillar.title}</h2><p>{pillar.text}</p></article>;
        })}
      </div>

      <section className="framework-science">
        <div className="panel-heading"><div><span className="eyebrow">Four lenses, one training loop</span><h2>Practice the moves your therapist is teaching</h2></div></div>
        <div className="science-framework-grid">
          {frameworks.map((framework) => <article key={framework.id} style={{ borderColor: `${framework.color}55` }}><span style={{ color: framework.color }}>{framework.shortName}</span><h3>{framework.name}</h3><p>{framework.question}</p></article>)}
        </div>
      </section>

      <section className="evidence-note">
        <Brain />
        <div><span className="eyebrow">What we can responsibly say</span><h2>Practice supports learning; it is not a treatment claim.</h2><p>Repeated retrieval and application are established learning principles, and research supports the importance of reappraisal quality, behavioral experiments, and practice in context. SHIFT does not claim that a game directly rewires the brain, treats a disorder, or guarantees that a skill will become automatic under stress.</p></div>
      </section>

      <section className="source-notes">
        <h2>Research notes informing this prototype</h2>
        <p>These references came from the research breakdowns supplied with the project. Original papers should be verified before public scientific claims or quotations are finalized.</p>
        <div><span>Kitson et al. (2024) · digital reappraisal</span><span>Kam et al. (2024) · brief reappraisal</span><span>Southward et al. (2022) · reappraisal quality</span><span>Murray & El-Leithy (2021) · behavioral experiments in PTSD</span><span>Uusberg et al. (2023) · reappraising reappraisal</span></div>
      </section>

      <p className="support-note">SHIFT is an educational practice companion. It is not therapy, crisis care, diagnosis, or a substitute for a licensed mental-health professional.</p>
    </section>
  );
}
