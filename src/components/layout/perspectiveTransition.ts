import { flushSync } from 'react-dom';

// Navigation remains immediate when View Transitions are unavailable. No
// timeout gates navigation, and interrupted animations never discard updates.
let running: ViewTransition | undefined;

export function shiftPerspective(update: () => void) {
  if (typeof document === 'undefined' || !document.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }

  running?.skipTransition();
  const transition = document.startViewTransition(() => flushSync(update));
  running = transition;
  void transition.ready.catch(() => { /* A skipped snapshot still runs update. */ });
  void transition.finished.finally(() => {
    if (running === transition) running = undefined;
  }).catch(() => { /* Navigation has already committed. */ });
}
