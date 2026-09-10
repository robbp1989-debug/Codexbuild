import React, { useState } from 'react';
import { Compass, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LIFE_CONTEXTS, normalizeLifeContext, type LifeContextId, CONTEXT_SCENES } from '../../data/lifeContexts';
import { useApp } from '../../context/AppContext';

export function LifeContextPicker({ inline = false }: { inline?: boolean }) {
  const { lifeContext, setLifeContext } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LifeContextId>(lifeContext);
  const selected = LIFE_CONTEXTS.find(item => item.id === lifeContext)!;
  if (inline) return <section className="life-context-home" aria-labelledby="life-context-title">
    <div className="life-context-home-heading">
      <div><h2 id="life-context-title">Life context</h2><p>Choose what fits your day. This changes the sample game questions—not your own story.</p></div>
      <span className="life-context-optional">Optional · change anytime</span>
    </div>
    <RadioGroup value={lifeContext} onValueChange={value => setLifeContext(normalizeLifeContext(value))} aria-labelledby="life-context-title" className="life-context-home-grid">
      {LIFE_CONTEXTS.map(item => <label key={item.id} title={item.description} className={`life-context-home-choice ${lifeContext === item.id ? 'is-selected' : ''}`}>
        <RadioGroupItem value={item.id} className="life-context-radio" /><span>{item.title}</span>
      </label>)}
    </RadioGroup>
    <p className="life-context-home-note" aria-live="polite"><strong>{selected.title} selected.</strong> Saved automatically on this device. Not sure? Everyday life is a good place to start.</p>
  </section>;
  return <>
    <button className="life-context-trigger" onClick={() => { setDraft(lifeContext); setOpen(true); }}>
      <Compass size={18} aria-hidden="true" /><span>Life context: <strong>{selected.title}</strong></span><span className="life-context-change">Change</span>
    </button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="life-context-dialog" showCloseButton>
        <div className="life-context-heading">
          <p className="life-context-eyebrow">Practice that fits your day</p>
          <DialogTitle className="text-2xl font-bold">Life context & daily rhythm</DialogTitle>
          <DialogDescription className="text-base leading-relaxed mt-3 text-slate-600">Choose the setting for sample questions. Switch whenever you like—no job title or personal details needed. Your own reflections stay unchanged.</DialogDescription>
        </div>
        <div className="life-context-body">
          <RadioGroup value={draft} onValueChange={value => setDraft(normalizeLifeContext(value))} aria-label="Life context" className="life-context-grid">
            {LIFE_CONTEXTS.map(item => <label key={item.id} className={`life-context-card ${draft === item.id ? 'is-selected' : ''}`}>
              <div className="flex justify-between items-center"><RadioGroupItem value={item.id} className="life-context-radio" />{draft === item.id && <Check size={18} aria-hidden="true" />}</div>
              <span className="font-semibold text-base mt-3 block">{item.title}</span>
              <span className="text-sm leading-relaxed block mt-1 text-slate-600">{item.description}</span>
            </label>)}
          </RadioGroup>
          <div className="life-context-example" aria-live="polite"><strong>Example question in this context</strong><p className="mt-2">“{CONTEXT_SCENES[draft][0].fact}”</p><p className="text-sm mt-1">Is this an observation or an added interpretation?</p></div>
          <p className="text-sm text-slate-600 mt-4">Saved on this device. The new context applies when you start your next game; a round already in progress keeps its questions.</p>
        </div>
        <div className="life-context-footer">
          <button onClick={() => setDraft('everyday')}>Reset to everyday life</button>
          <div className="flex gap-2"><button onClick={() => setOpen(false)}>Cancel</button><button className="life-context-apply" onClick={() => { setLifeContext(draft); setOpen(false); }}>Apply context</button></div>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
