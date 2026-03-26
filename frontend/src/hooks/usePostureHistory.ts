import { useState, useEffect, useRef, useCallback } from 'react';
import { computePosture } from '../engine/computePosture';
import type { PostureHistoryEntry } from '../interfaces/PostureHistoryEntry.interface';

interface UsePostureHistoryOptions {
  maxEntries?: number;
  intervalMs?: number;
  enableInterval?: boolean;
}

export function usePostureHistory(
  ranks: Record<string, number>,
  options: UsePostureHistoryOptions = {}
) {
  const {
    maxEntries = 20,
    intervalMs = 30000,
    enableInterval = true,
  } = options;

  const [history, setHistory] = useState<PostureHistoryEntry[]>([]);
  const prevRanksRef = useRef<Record<string, number> | null>(null);

  const addEntry = useCallback((currentRanks: Record<string, number>) => {
    const posture = computePosture(currentRanks);
    const entry: PostureHistoryEntry = {
      timestamp: Date.now(),
      ranks: { ...currentRanks },
      postureScore: posture.score,
      hand: posture.hand,
    };

    setHistory(prev => {
      const updated = [...prev, entry];
      return updated.slice(-maxEntries);
    });
  }, [maxEntries]);

  // Detect rank changes and add entry
  useEffect(() => {
    const ranksChanged = prevRanksRef.current === null ||
      Object.keys(ranks).some(k => ranks[k] !== prevRanksRef.current![k]);

    if (ranksChanged) {
      addEntry(ranks);
    }

    prevRanksRef.current = { ...ranks };
  }, [ranks, addEntry]);

  // Interval-based recording
  useEffect(() => {
    if (!enableInterval) return;

    const timer = setInterval(() => {
      addEntry(ranks);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [ranks, intervalMs, enableInterval, addEntry]);

  return { history };
}
