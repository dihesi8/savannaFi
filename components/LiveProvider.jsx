'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import useLive from '@/hooks/useLive';

const Ctx = createContext(null);
export const useLiveData = () => useContext(Ctx);

const KEY = 'savannafi:xau-samples';
const MAX = 90;

export default function LiveProvider({ children }) {
  const gold = useLive('/api/gold', 10000);
  const chain = useLive('/api/chain', 6000);
  const svn = useLive('/api/svn', 12000);
  const [samples, setSamples] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || '[]');
      if (Array.isArray(saved)) setSamples(saved.slice(-MAX));
    } catch {}
  }, []);

  useEffect(() => {
    const p = gold.data?.price;
    if (!p) return;
    setSamples((prev) => {
      const next = [...prev, { t: Date.now(), p }].slice(-MAX);
      try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [gold.data]);

  return <Ctx.Provider value={{ gold, chain, svn, samples }}>{children}</Ctx.Provider>;
}
