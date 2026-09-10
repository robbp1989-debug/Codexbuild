import { useState } from 'react';
import { useApp } from './AppContext';
import { buildContextPractice } from '../data/lifeContexts';

export function usePracticeContent() {
  const { lifeContext } = useApp();
  // Snapshot at round start: changing a profile never changes a scored question mid-round.
  const [content] = useState(() => buildContextPractice(lifeContext));
  return content;
}
