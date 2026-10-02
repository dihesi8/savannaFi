'use client';
import { useEffect, useRef, useState } from 'react';

// Polls a JSON endpoint, pauses when the tab is hidden, keeps the last good value on failure.
export default function useLive(url, intervalMs = 10000) {
  const [state, setState] = useState({ data: null, error: false, loading: true });
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) throw new Error(String(r.status));
        const data = await r.json();
        if (alive) setState({ data, error: false, loading: false });
      } catch {
        if (alive) setState((s) => ({ ...s, error: true, loading: false }));
      }
    };
    const start = () => {
      run();
      clearInterval(timer.current);
      timer.current = setInterval(run, intervalMs);
    };
    const onVis = () => (document.hidden ? clearInterval(timer.current) : start());
    start();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      alive = false;
      clearInterval(timer.current);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [url, intervalMs]);

  return state;
}
