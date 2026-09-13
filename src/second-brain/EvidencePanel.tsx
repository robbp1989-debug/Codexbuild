import React, { useState } from 'react';
import { KNOWLEDGE_CARDS, selectCards } from './knowledge';
export function EvidencePanel({query = '', all = false}: {query?: string; all?: boolean}) {
  const [practice, setPractice] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const cards = all ? KNOWLEDGE_CARDS : selectCards(query);
  return <details className="my-4 rounded-2xl border border-sky-200 bg-white/90 p-4 text-slate-800">
    <summary className="cursor-pointer text-base font-semibold">{all ? 'Research behind these skills' : 'Explore a source-informed skill'}</summary>
    <p className="mt-3 text-sm">These are optional educational adaptations. Their sources have been checked; SHIFT’s adaptations still await independent clinical review. They do not establish what caused your experience.</p>
    {!cards.length && <p className="mt-3 text-sm">No exercise is selected for this description. You can pause, clarify what help you want, or seek personal support.</p>}
    {cards.map(card => <article key={card.id} className="mt-4 border-t border-sky-100 pt-4">
      <h3 className="text-base font-semibold">{card.title}</h3><p className="mt-1 text-sm">{card.purpose}</p>
      <button type="button" onClick={() => { setPractice(card.id); setStep(0); }} className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-base text-white">Try this skill</button>
      {practice === card.id && <div className="my-3 rounded-xl bg-sky-50 p-4" aria-live="polite">
        <p className="text-base">{step < card.steps.length ? card.steps[step] : 'Was this useful? You can keep what fits, change your approach, or leave the question open.'}</p>
        <p className="mt-2 text-sm">Reflect privately. Nothing you think through here is recorded or scored.</p>
        {step < card.steps.length && <button type="button" className="mr-4 mt-3 text-base text-blue-700 underline" onClick={() => setStep(n=>n+1)}>Continue</button>}
        <button type="button" className="mt-3 text-base underline" onClick={() => setPractice(null)}>Finish or pause</button>
      </div>}
      <a href={card.source.url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">{card.source.title}</a>
      <p className="mt-2 text-sm">{card.source.support} The exact SHIFT exercise and games have not been clinically validated.</p>
    </article>)}
  </details>;
}
