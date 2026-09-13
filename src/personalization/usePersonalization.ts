import { useEffect, useReducer, useState } from 'react';
import {
  intakeReducer,
  initialIntake,
  restoreIntake,
} from '../holly/intakeReducer';
import {
  PROFILE_KEY,
  DRAFT_KEY,
  MAX_CONTEXT,
  contextSize,
  restoreItems,
  type ContextItem,
} from './model';
export function usePersonalization() {
  const [personalizationRevision, setRevision] = useState(0);
  const [personalContext, setContext] = useState<ContextItem[]>([]);
  const [contextRemembered, setRemembered] = useState(false);
  const [rememberIntake, setRememberIntake] = useState(false);
  const [intake, dispatchIntake] = useReducer(intakeReducer, initialIntake);
  const [loaded, setLoaded] = useState(false);
  const [contextNotice, setContextNotice] = useState('');
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const saved = localStorage.getItem(PROFILE_KEY);
        if (saved) {
          setContext(restoreItems(JSON.parse(saved)));
          setRemembered(true);
        }
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          const state = restoreIntake(JSON.parse(draft));
          // Restore through a dedicated hydration action, preserving one reducer.
          setRememberIntake(true);
          dispatchIntake({ type: 'restore', state });
        }
      } catch {
        setContextNotice(
          'Saved context could not be read. You can continue for this visit.',
        );
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      if (rememberIntake)
        localStorage.setItem(DRAFT_KEY, JSON.stringify(intake));
      else localStorage.removeItem(DRAFT_KEY);
    } catch {
      queueMicrotask(() =>
        setContextNotice(
          'Draft could not be saved on this device. Keep this tab open.',
        ),
      );
    }
  }, [intake, rememberIntake, loaded]);
  function savePersonalContext(
    items: ContextItem[],
    remember = contextRemembered,
  ) {
    if (contextSize(items) > MAX_CONTEXT || items.length > 100) {
      setContextNotice(
        'Please shorten or remove some approved context before saving (6,000 character budget).',
      );
      return false;
    }
    try {
      if (remember) localStorage.setItem(PROFILE_KEY, JSON.stringify(items));
      else localStorage.removeItem(PROFILE_KEY);
    } catch {
      setContextNotice(
        'Browser storage could not be updated. Please check your storage settings.',
      );
      return false;
    }
    setContext(items);
    setRemembered(remember);
    setContextNotice(
      'Approved context updated. Changes apply to future messages.',
    );
    return true;
  }
  function clearPersonalization() {
    setRevision(value => value + 1);
    setContext([]);
    setRemembered(false);
    setRememberIntake(false);
    dispatchIntake({ type: 'reset' });
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      setContextNotice(
        'Browser storage could not be cleared. Clear site data in your browser settings.',
      );
    }
  }
  return {
    personalContext,
    personalizationRevision,
    contextRemembered,
    savePersonalContext,
    clearPersonalization,
    contextNotice,
    intake,
    dispatchIntake,
    rememberIntake,
    setRememberIntake,
  };
}
