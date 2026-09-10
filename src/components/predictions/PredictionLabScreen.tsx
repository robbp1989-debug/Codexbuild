import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PredictionRecord } from '../../types';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  FlaskConical,
  Loader2,
  Plus,
  Save,
} from 'lucide-react';

type FearedOutcomeResult = 'yes' | 'partly' | 'no' | 'different_entirely';
type OutcomeRating = NonNullable<PredictionRecord['outcomeRating']>;

const FEARED_OPTIONS: Array<{ value: FearedOutcomeResult; label: string }> = [
  { value: 'no', label: 'No' },
  { value: 'partly', label: 'Partly' },
  { value: 'yes', label: 'Yes' },
  { value: 'different_entirely', label: 'Something different happened' },
];

const RATING_OPTIONS: Array<{ value: OutcomeRating; label: string }> = [
  { value: 'better_than_expected', label: 'Better than expected' },
  { value: 'about_as_expected', label: 'About as expected' },
  { value: 'worse_than_expected', label: 'Worse than expected' },
  { value: 'mixed_partly_true', label: 'Mixed / partly true' },
  { value: 'still_unfolding', label: 'Still unfolding' },
  { value: 'not_sure', label: 'Not sure yet' },
];

export const PredictionLabScreen: React.FC = () => {
  const {
    predictions,
    addPrediction,
    resolvePrediction,
    addMemoryItem,
    playSoftSound,
  } = useApp();

  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'pending' | 'tested'>('all');
  const [editingPredId, setEditingPredId] = useState<string | null>(null);
  const [outcomeText, setOutcomeText] = useState('');
  const [learningText, setLearningText] = useState('');
  const [didFearedHappen, setDidFearedHappen] = useState<FearedOutcomeResult>('no');
  const [outcomeRating, setOutcomeRating] = useState<OutcomeRating>('better_than_expected');
  const [strategyHelped, setStrategyHelped] = useState(false);
  const [rememberForFuture, setRememberForFuture] = useState(false);
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [newContext, setNewContext] = useState('');
  const [newPredicted, setNewPredicted] = useState('');
  const [newConfidence, setNewConfidence] = useState(80);
  const [newExperiment, setNewExperiment] = useState('');

  const filtered = activeTabFilter === 'all'
    ? predictions
    : predictions.filter((prediction) => prediction.status === activeTabFilter);

  const resetOutcomeForm = () => {
    setEditingPredId(null);
    setOutcomeText('');
    setLearningText('');
    setDidFearedHappen('no');
    setOutcomeRating('better_than_expected');
    setStrategyHelped(false);
    setRememberForFuture(false);
  };

  const startOutcome = (prediction: PredictionRecord) => {
    playSoftSound('tap');
    setEditingPredId(prediction.id);
    setOutcomeText(prediction.whatActuallyHappened || '');
    setLearningText(prediction.learningInsight || prediction.learningNote || '');
    setDidFearedHappen(prediction.didFearedOutcomeHappen || 'no');
    setOutcomeRating(prediction.outcomeRating || 'better_than_expected');
    setStrategyHelped(false);
    setRememberForFuture(false);
    setSaveNotice('');
  };

  const handleSaveOutcome = async (prediction: PredictionRecord) => {
    const actual = outcomeText.trim();
    if (!actual || savingOutcome) return;

    const learning = learningText.trim();
    setSavingOutcome(true);
    setSaveNotice('');

    // First preserve the user's real-world result locally. This remains useful even
    // if account persistence is unavailable or the user chose session/device use.
    resolvePrediction(
      prediction.id,
      actual,
      didFearedHappen,
      learning,
      outcomeRating,
    );

    if (strategyHelped && prediction.intendedAction?.trim()) {
      addMemoryItem(
        'HELPFUL_STRATEGY',
        `A response that helped in a real-world test: ${prediction.intendedAction.trim()}`,
        'active',
        prediction.reflectionId || prediction.id,
      );
    }

    playSoftSound('complete');

    if (!rememberForFuture) {
      setSaveNotice('Outcome recorded on this device. It was not added to account learning memory.');
      setSavingOutcome(false);
      resetOutcomeForm();
      return;
    }

    try {
      const response = await fetch('/api/shift/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId: prediction.id,
          sourceShiftId: prediction.reflectionId,
          prediction: prediction.predictedOutcome,
          actualOutcome: actual,
          learning,
          intendedAction: prediction.intendedAction,
          didFearedHappen,
          outcomeRating,
          strategyHelped,
          rememberForFuture: true,
        }),
      });
      const data = await response.json() as {
        persisted?: boolean;
        remembered?: boolean;
        accountRequired?: boolean;
        error?: string;
      };

      if (!response.ok) throw new Error(data.error || 'Account learning could not be saved.');
      if (data.accountRequired) {
        setSaveNotice('Outcome recorded locally. Sign in with ChatGPT to carry this learning across devices.');
      } else if (data.remembered) {
        setSaveNotice('Outcome recorded and added to your account learning memory.');
      } else {
        setSaveNotice('Outcome recorded locally. Account learning was not changed.');
      }
    } catch (error) {
      setSaveNotice(
        error instanceof Error
          ? `Outcome recorded locally. ${error.message}`
          : 'Outcome recorded locally, but account learning could not be updated.',
      );
    } finally {
      setSavingOutcome(false);
      resetOutcomeForm();
    }
  };

  const handleCreatePrediction = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newContext.trim() || !newPredicted.trim()) return;
    playSoftSound('complete');
    addPrediction({
      cueContext: newContext.trim(),
      intendedAction: newExperiment.trim(),
      fearedConsequence: newPredicted.trim(),
      predictedOutcome: newPredicted.trim(),
      confidencePercent: newConfidence,
    });
    setIsCreating(false);
    setNewContext('');
    setNewPredicted('');
    setNewExperiment('');
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950 border border-amber-500/30 text-amber-400 text-xs font-mono mb-2">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>BELIEF UPDATING ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">Prediction Lab</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Commit the prediction before the outcome, then compare it with what actually happened. Repeated real-world evidence can become stronger personal learning than advice alone.
          </p>
        </div>

        <button
          onClick={() => {
            playSoftSound('tap');
            setIsCreating(!isCreating);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs cursor-pointer transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Cancel' : 'Log New Prediction'}</span>
        </button>
      </div>

      {saveNotice && (
        <div className="rounded-xl border border-sky-500/25 bg-sky-950/20 px-4 py-3 text-xs text-sky-100 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
          <span>{saveNotice}</span>
        </div>
      )}

      {isCreating && (
        <form onSubmit={handleCreatePrediction} className="p-6 rounded-2xl bg-slate-900 border border-teal-500/40 space-y-4 shadow-xl animate-in fade-in">
          <h3 className="text-sm font-bold text-slate-100">Log the Prediction Before You Know the Result</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Triggering situation / context</label>
              <input
                type="text"
                value={newContext}
                onChange={(event) => setNewContext(event.target.value)}
                placeholder="e.g. Speaking up in Monday sprint review"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">What do you predict will happen?</label>
              <input
                type="text"
                value={newPredicted}
                onChange={(event) => setNewPredicted(event.target.value)}
                placeholder="e.g. If I disagree, they will become angry and reject what I say."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">What action will you try?</label>
              <input
                type="text"
                value={newExperiment}
                onChange={(event) => setNewExperiment(event.target.value)}
                placeholder="e.g. State one preference without overexplaining."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>How likely does the prediction feel right now?</span>
                <span className="font-mono text-teal-300 font-bold">{newConfidence}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={newConfidence}
                onChange={(event) => setNewConfidence(Number(event.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold">Save Prediction</button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {(['all', 'pending', 'tested'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              playSoftSound('tap');
              setActiveTabFilter(tab);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase font-mono cursor-pointer transition-all whitespace-nowrap ${
              activeTabFilter === tab
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab} ({predictions.filter((prediction) => tab === 'all' || prediction.status === tab).length})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
            <Brain className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-300">No predictions in this view yet.</p>
          </div>
        )}

        {filtered.map((prediction) => {
          const isPending = prediction.status === 'pending';
          const isEditing = editingPredId === prediction.id;

          return (
            <div key={prediction.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-semibold text-slate-200">Context: {prediction.cueContext}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold shrink-0 ${
                  prediction.status === 'tested'
                    ? 'bg-teal-950 text-teal-300 border border-teal-700/50'
                    : 'bg-amber-950 text-amber-300 border border-amber-700/50'
                }`}>
                  {prediction.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Prediction</span>
                    <span className="text-[10px] text-slate-400 font-mono">{prediction.confidencePercent}% felt likely</span>
                  </div>
                  <p className="text-slate-200 italic">“{prediction.predictedOutcome}”</p>
                  {prediction.intendedAction && (
                    <p className="text-[11px] text-slate-500 pt-1"><strong className="text-slate-400">Action tested:</strong> {prediction.intendedAction}</p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-teal-500/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-teal-400 uppercase">Observed outcome</span>
                  <p className="text-slate-200">
                    {prediction.whatActuallyHappened ? `“${prediction.whatActuallyHappened}”` : 'Not recorded yet.'}
                  </p>
                  {(prediction.learningInsight || prediction.learningNote) && (
                    <span className="text-[11px] text-teal-300 block pt-1 border-t border-slate-800">
                      <strong>What I learned:</strong> {prediction.learningInsight || prediction.learningNote}
                    </span>
                  )}
                  {prediction.didFearedOutcomeHappen && (
                    <span className="text-[10px] text-slate-500 block">Feared outcome: {prediction.didFearedOutcomeHappen.replaceAll('_', ' ')}</span>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-xs animate-in fade-in">
                  <div>
                    <span className="font-bold text-slate-200 block">Record what happened, then decide what it means.</span>
                    <p className="text-[11px] text-slate-500 mt-1">The outcome is evidence. It does not have to prove the old prediction completely right or completely wrong.</p>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">What actually happened?</label>
                    <textarea
                      value={outcomeText}
                      onChange={(event) => setOutcomeText(event.target.value)}
                      rows={3}
                      placeholder="Describe the observable result."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 resize-none focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-2">Did the feared outcome happen?</label>
                    <div className="flex flex-wrap gap-2">
                      {FEARED_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDidFearedHappen(option.value)}
                          className={`px-3 py-1.5 rounded-lg border text-[11px] ${
                            didFearedHappen === option.value
                              ? 'border-amber-400 bg-amber-500/15 text-amber-200'
                              : 'border-slate-700 bg-slate-900 text-slate-400'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Compared with what you expected, how did it turn out?</label>
                    <select
                      value={outcomeRating}
                      onChange={(event) => setOutcomeRating(event.target.value as OutcomeRating)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      {RATING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">What does this teach your working model?</label>
                    <textarea
                      value={learningText}
                      onChange={(event) => setLearningText(event.target.value)}
                      rows={2}
                      placeholder="A cautious takeaway is enough. You can also leave this blank if the result is still unclear."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 resize-none focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {prediction.intendedAction?.trim() && (
                    <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900/70 p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={strategyHelped}
                        onChange={(event) => setStrategyHelped(event.target.checked)}
                        className="mt-0.5 accent-teal-500"
                      />
                      <span>
                        <span className="text-slate-200 font-semibold block">The response I tried was helpful.</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">Only if you check this can SHIFT treat that action as a personally tested helpful strategy.</span>
                      </span>
                    </label>
                  )}

                  <label className="flex items-start gap-2.5 rounded-xl border border-sky-500/20 bg-sky-950/15 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberForFuture}
                      onChange={(event) => setRememberForFuture(event.target.checked)}
                      className="mt-0.5 accent-sky-500"
                    />
                    <span>
                      <span className="text-sky-100 font-semibold flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Use this outcome to personalize future SHIFT</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Off by default. If enabled and you are signed in, a compact learning record is saved to account memory. The detailed event is not inserted into normal future prompts.</span>
                    </span>
                  </label>

                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" disabled={savingOutcome} onClick={resetOutcomeForm} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-medium">Cancel</button>
                    <button
                      type="button"
                      disabled={savingOutcome || !outcomeText.trim()}
                      onClick={() => void handleSaveOutcome(prediction)}
                      className="px-4 py-1.5 rounded-lg bg-teal-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold inline-flex items-center gap-2"
                    >
                      {savingOutcome ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Update Working Model
                    </button>
                  </div>
                </div>
              ) : isPending ? (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => startOutcome(prediction)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold cursor-pointer"
                  >
                    <span>Record Outcome</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
