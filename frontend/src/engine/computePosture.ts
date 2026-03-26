export interface PostureResult {
  hand: string;
  tier: number;
  score: number;
  royal: boolean;
  desc: string;
}

/**
 * Derives a poker hand label and score from the four suit ranks.
 */
export function computePosture(ranks: Record<string, number>): PostureResult {
  const vals = Object.values(ranks);
  const counts: Record<number, number> = {};
  vals.forEach(v => { counts[v] = (counts[v] ?? 0) + 1; });
  const freq = Object.values(counts).sort((a, b) => b - a);
  const sorted = [...vals].sort((a, b) => a - b);
  const isStraight =
    sorted[3] - sorted[0] === 3 && new Set(sorted).size === 4;

  if (vals.every(v => v >= 11))
    return { hand: 'ROYAL FLUSH',    tier: 7, score: 100, royal: true,  desc: 'Maximum Defense Posture' };
  if (freq[0] === 4)
    return { hand: 'FOUR OF A KIND', tier: 6, score: 92,  royal: false, desc: 'Elite Posture' };
  if (freq[0] === 3 && freq[1] === 2)
    return { hand: 'FULL HOUSE',     tier: 5, score: 84,  royal: false, desc: 'Strong Posture' };
  if (isStraight)
    return { hand: 'STRAIGHT',       tier: 4, score: 76,  royal: false, desc: 'Balanced Posture' };
  if (freq[0] === 3)
    return { hand: 'THREE OF A KIND',tier: 3, score: 65,  royal: false, desc: 'Developing Posture' };
  if (freq[0] === 2 && freq[1] === 2)
    return { hand: 'TWO PAIR',       tier: 2, score: 54,  royal: false, desc: 'Partial Coverage' };
  if (freq[0] === 2)
    return { hand: 'ONE PAIR',       tier: 1, score: 40,  royal: false, desc: 'Limited Coverage' };

  const highScore = Math.round((vals.reduce((a, b) => a + b, 0) / 4) * 5);
  return { hand: 'HIGH CARD', tier: 0, score: highScore, royal: false, desc: 'Exposed Posture' };
}

export interface OptimalHandResult {
  targetRanks: Record<string, number>;
  targetHand: string;
  targetScore: number;
}

/**
 * Computes the best reachable hand if each suit rank is upgraded by 1.
 */
export function computeOptimalHand(ranks: Record<string, number>): OptimalHandResult {
  const targetRanks = Object.fromEntries(
    Object.entries(ranks).map(([k, v]) => [k, Math.min(13, v + 1)]),
  );
  const result = computePosture(targetRanks);
  return { targetRanks, targetHand: result.hand, targetScore: result.score };
}
