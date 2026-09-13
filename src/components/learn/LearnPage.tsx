import { EvidencePanel } from '../../second-brain/EvidencePanel';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  CheckCircle2,
  Brain,
  Eye,
  Shield,
  Scale,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface LearnModule {
  id: string;
  title: string;
  subtitle: string;
  estimatedMinutes: string;
  category: string;
  overview: string;
  keyTakeaway: string;
  exampleStory: string;
  practiceTip: string;
  reflectionPrompt: string;
  targetArcadeMode?: string;
}

const MODULES: LearnModule[] = [
  {
    id: 'camera-test',
    title: 'The Camera Test',
    subtitle: 'Separating Observable Facts from Mental Narration',
    estimatedMinutes: '2 min',
    category: 'Observation',
    overview:
      'Human brains are prediction machines designed for physical survival, not objective journalism. When tension strikes, our nervous system immediately bundles sensory stimuli with threat interpretations—often so quickly that we believe we "saw" another person’s anger or rejection.',
    keyTakeaway:
      'If a high-definition video camera mounted on the wall could not capture it, it is a mental narrative, not a verified event.',
    exampleStory:
      'Camera view: "Alex looked down at their laptop for 10 seconds without speaking." Mind’s interpretation: "Alex hates my idea and thinks I am incompetent."',
    practiceTip:
      'Before reacting, ask: "What did I directly hear or see?" Strip away adverbs and assumed intentions.',
    reflectionPrompt: 'Think of a recent moment of tension. What would the camera have recorded?',
    targetArcadeMode: 'fact_or_story',
  },
  {
    id: 'affect-labeling',
    title: 'Affect Labeling',
    subtitle: 'Why Naming Sensations Quiets Amygdala Reactivity',
    estimatedMinutes: '2 min',
    category: 'Physiology',
    overview:
      'fMRI studies at UCLA demonstrated that when participants put feelings into words ("I feel anger" or "I feel tightness in my throat"), activation in the amygdala decreases while activation in the right ventrolateral prefrontal cortex increases.',
    keyTakeaway:
      'Naming an emotion creates a cognitive buffer between the visceral sensation and the automatic behavioral urge.',
    exampleStory:
      'Instead of immediately sending a defensive text message, a person pauses and says to themselves: "I feel a hot flush of embarrassment and an urge to withdraw."',
    practiceTip:
      'Name both the discrete emotion (e.g. Shame, Vulnerability) and the bodily location (e.g. Jaw tension, Shallow breathing).',
    reflectionPrompt: 'Where in your body do you first notice stress or perceived conflict?',
    targetArcadeMode: 'cue_response',
  },
  {
    id: 'unmet-needs',
    title: 'Unmet Needs & Boundaries',
    subtitle: 'The Core Engine Beneath Anxiety and Anger',
    estimatedMinutes: '3 min',
    category: 'Self-Advocacy',
    overview:
      'Anger and anxiety are rarely primary defects; they are alarm signals warning that a legitimate human need (rest, safety, respect, clarity, autonomy) is being compromised. If we skip naming our need and jump straight into judging others, we remain helpless.',
    keyTakeaway:
      'Before asking "What is wrong with them?", ask "What did I need, want, or need to protect in that moment?"',
    exampleStory:
      'A person who felt enraged by late-night work messages realized the underlying need was not anger at their boss, but an unexpressed need for cognitive rest and evening boundaries.',
    practiceTip:
      'Express requests in terms of positive, concrete actions rather than what you want the other person to stop feeling.',
    reflectionPrompt: 'What is a need you frequently minimize to keep peace?',
    targetArcadeMode: 'boundary_builder',
  },
  {
    id: 'protective-rules',
    title: 'Protective Rules & Survival Heuristics',
    subtitle: 'Why Old Habits Make Total Sense in Historical Context',
    estimatedMinutes: '3 min',
    category: 'Patterns',
    overview:
      'Our protective habits—people-pleasing, perfectionism, hyper-independence, emotional withdrawal—are not character flaws. They were brilliant survival adaptations developed to navigate unpredictable families, schools, or early work environments.',
    keyTakeaway:
      'Honor the old rule for protecting you in the past, but recognize when you are using an old survival tool in a safe present-day room.',
    exampleStory:
      'Growing up in a home where conflict meant yelling, a person learned: "If someone is upset, go silent immediately." In an adult workplace, that silence prevents collaborative problem-solving.',
    practiceTip:
      'Formulate your rule explicitly: "When [cue], I predict [danger], so I [protect]." Once named, it can be updated.',
    reflectionPrompt: 'What rule kept you safe in childhood that now feels constricting?',
    targetArcadeMode: 'rule_recall',
  },
  {
    id: 'empirical-predictions',
    title: 'Empirical Predictions',
    subtitle: 'Defeating Hindsight Bias and Testing Reality',
    estimatedMinutes: '3 min',
    category: 'Cognitive Science',
    overview:
      'Hindsight bias is the mind’s tendency to claim "I knew it all along." It prevents us from learning that our feared catastrophes rarely materialize. By committing a prediction to writing *before* taking a healthy step, we create an unchangeable benchmark for reality.',
    keyTakeaway:
      'True confidence comes from empirical data: repeatedly noticing that catastrophic predictions do not match actual outcomes.',
    exampleStory:
      'Predicted: "If I ask for deadline relief, my lead will say I am slacking." Reality: "My lead agreed immediately and thanked me for speaking up early."',
    practiceTip:
      'Lock in the prediction with a percentage confidence. Then inspect reality with scientific curiosity.',
    reflectionPrompt: 'What is a small experiment you could run this week?',
    targetArcadeMode: 'prediction_check',
  },
];

export const LearnPage: React.FC = () => {
  const { setActiveTab, playSoftSound } = useApp();
  const [selectedModule, setSelectedModule] = useState<LearnModule>(MODULES[0]);

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 space-y-8">
      <EvidencePanel all />
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-400 font-semibold mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Interactive Psychological Curriculum</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          The Foundations of SHIFT
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Explore source-checked skills above. The older learning modules below are draft educational material awaiting source and clinical review.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Module Nav Column */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-mono text-slate-500 uppercase font-semibold block px-2 mb-1">
            Learning Modules
          </span>
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => {
                playSoftSound('tap');
                setSelectedModule(mod);
              }}
              className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                selectedModule.id === mod.id
                  ? 'bg-teal-500/15 border-teal-500/50 shadow-md'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-750'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                <span className="text-teal-400">{mod.category}</span>
                <span className="text-slate-500">{mod.estimatedMinutes}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">{mod.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {mod.subtitle}
              </p>
            </button>
          ))}
        </div>

        {/* Selected Module Detail View */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
              <span>{selectedModule.category}</span>
              <span>•</span>
              <span>{selectedModule.estimatedMinutes} read</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {selectedModule.title}
            </h2>
            <p className="text-sm text-slate-300 font-medium">
              {selectedModule.subtitle}
            </p>
          </div>

          {/* Overview */}
          <div className="text-sm text-slate-300 leading-relaxed space-y-3">
            <p>{selectedModule.overview}</p>
          </div>

          {/* Key Takeaway Card */}
          <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-800/60 space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold block">
              Core Takeaway
            </span>
            <p className="text-sm text-teal-100 font-medium leading-relaxed">
              {selectedModule.keyTakeaway}
            </p>
          </div>

          {/* Real-World Case Example */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
            <span className="font-mono text-amber-400 font-semibold uppercase block">
              Real-World Example
            </span>
            <p className="text-slate-300 leading-relaxed font-serif italic text-sm">
              "{selectedModule.exampleStory}"
            </p>
          </div>

          {/* Practice Tip */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
            <span className="font-mono text-sky-400 font-semibold uppercase block">
              How to Apply This Today
            </span>
            <p className="text-slate-300 leading-relaxed">
              {selectedModule.practiceTip}
            </p>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                playSoftSound('tap');
                setActiveTab('reflect');
              }}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <span>Reflect on this concept</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                playSoftSound('tap');
                setActiveTab('arcade');
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <Brain className="w-4 h-4 text-teal-400" />
              <span>Practice in Arcade</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
