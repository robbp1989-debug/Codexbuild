'use client';

import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

interface LearningCandidate {
  type: string;
  label: string;
  summary: string;
  tags?: string[];
  confidence?: string;
}

function signatureForShift(shift: any): string {
  const value = [
    shift?.id,
    shift?.userEditedObservation || shift?.observation,
    (shift?.confirmed_emotions || []).join(','),
    (shift?.confirmed_needs || []).join(','),
    shift?.hypothesisUserStatus,
    shift?.userEditedHypothesis || shift?.protective_rule_hypothesis,
    shift?.userEditedPerspective || shift?.updated_perspective,
    shift?.userEditedChoice || shift?.choice,
    shift?.real_world_experiment,
  ].join('|');

  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export const LearningMemorySync: React.FC = () => {
  const { activeShift, memoryItems, addMemoryItem, removeMemoryItem } = useApp();
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!activeShift || !activeShift.isSavedToProfile || activeShift.savePreference !== 'remember') return;

    const signature = signatureForShift(activeShift);
    const key = `shift_learning_compacted_v1:${activeShift.id}`;
    try {
      if (localStorage.getItem(key) === signature) return;
    } catch {
      // If storage is unavailable, the in-flight guard still prevents duplicate work.
    }
    if (inFlight.current.has(signature)) return;
    inFlight.current.add(signature);

    // Do not cancel this one-time privacy compaction simply because another piece of
    // app state rerenders while the request is in flight. The active Shift id and
    // signature are captured here, and duplicate calls are guarded above.
    void fetch('/api/shift/memory/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shift: activeShift }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Memory extraction failed');
        return response.json() as Promise<{ memories?: LearningCandidate[] }>;
      })
      .then((data) => {
        if (!Array.isArray(data.memories) || data.memories.length === 0) return;

        memoryItems
          .filter((item) => item.sourceSessionId === activeShift.id)
          .forEach((item) => removeMemoryItem(item.id));

        data.memories.slice(0, 5).forEach((memory) => {
          const tags = memory.tags?.length ? ` | tags: ${memory.tags.join(', ')}` : '';
          addMemoryItem(
            memory.type as any,
            `${memory.label}: ${memory.summary}${tags}`,
            'active',
            activeShift.id,
          );
        });

        try {
          localStorage.setItem(key, signature);
        } catch {
          // Compaction still succeeded for this session.
        }
      })
      .catch((error) => {
        console.info('[SHIFT Memory] Could not compact this saved reflection yet:', error);
      })
      .finally(() => {
        inFlight.current.delete(signature);
      });
  }, [activeShift, memoryItems, addMemoryItem, removeMemoryItem]);

  return null;
};
