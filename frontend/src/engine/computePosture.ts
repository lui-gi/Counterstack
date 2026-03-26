import { SUIT_DATA } from '../data/gameData';

interface PostureHandResult {
  hand: string;
  tier: number;
  score: number;
  royal: boolean;
  desc: string;
}

export function computeAiRank(suit: string, telemetry: Record<string, number>): number {
  const base = SUIT_DATA[suit].baseScore;
  const adj = (telemetry[suit] || 0);
  const raw = Math.max(1, Math.min(13, Math.round(((base + adj) / 100) * 13)));
  return raw;
}

export function computePosture(ranks: Record<string, number>): PostureHandResult {
  const vals = Object.values(ranks) as number[];
  const counts: Record<number, number> = {};
  vals.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const freq = (Object.values(counts) as number[]).sort((a, b) => b - a);
  const sorted = [...vals].sort((a, b) => a - b);
  const isStr = sorted[3] - sorted[0] === 3 && new Set(sorted).size === 4;

  // Base score: sum of ranks / max possible (52) × 100
  const sum = vals.reduce((a, b) => a + b, 0);
  const baseScore = (sum / 52) * 100;

  // Determine hand type and multiplier
  let hand: string;
  let tier: number;
  let multiplier: number;
  let royal: boolean;
  let desc: string;

  if (vals.every(v => v >= 11)) {
    hand = "ROYAL FLUSH";
    tier = 7;
    multiplier = 1.00;
    royal = true;
    desc = "Maximum Defense Posture";
  } else if (freq[0] === 4) {
    hand = "FOUR OF A KIND";
    tier = 6;
    multiplier = 1.00;
    royal = false;
    desc = "Elite Posture";
  } else if (freq[0] === 3 && freq[1] === 1) {
    hand = "THREE OF A KIND";
    tier = 3;
    multiplier = 0.90;
    royal = false;
    desc = "Developing Posture";
  } else if (freq[0] === 2 && freq[1] === 2) {
    hand = "TWO PAIR";
    tier = 2;
    multiplier = 0.85;
    royal = false;
    desc = "Partial Coverage";
  } else if (isStr) {
    hand = "STRAIGHT";
    tier = 4;
    multiplier = 0.95;
    royal = false;
    desc = "Balanced Posture";
  } else if (freq[0] === 2) {
    hand = "ONE PAIR";
    tier = 1;
    multiplier = 0.80;
    royal = false;
    desc = "Limited Coverage";
  } else {
    hand = "HIGH CARD";
    tier = 0;
    multiplier = 0.75;
    royal = false;
    desc = "Exposed Posture";
  }

  // Final score = base × multiplier, clamped to 0-100
  const score = Math.round(Math.min(100, Math.max(0, baseScore * multiplier)));

  return { hand, tier, score, royal, desc };
}

export interface OptimalHandResult {
  targetRanks: Record<string, number>;
  targetHand: string;
  targetScore: number;
  isAlreadyOptimal: boolean;
}

export function computeOptimalHand(ranks: Record<string, number>): OptimalHandResult {
  const current = computePosture(ranks);
  const suitKeys = Object.keys(ranks);

  if (current.hand === 'ROYAL FLUSH') {
    return { targetRanks: { ...ranks }, targetHand: 'ROYAL FLUSH', targetScore: current.score, isAlreadyOptimal: true };
  }

  const target = { ...ranks };

  // Build frequency groups: rank → [suitKeys]
  const freq: Record<number, string[]> = {};
  suitKeys.forEach(k => {
    const v = ranks[k];
    freq[v] = freq[v] ? [...freq[v], k] : [k];
  });
  const groups = Object.entries(freq)
    .map(([r, keys]) => ({ rank: Number(r), keys }))
    .sort((a, b) => b.rank - a.rank); // highest rank first

  const maxRank = groups[0].rank;

  if (current.hand === 'HIGH CARD') {
    // → One Pair: raise 2nd highest suit to match highest
    const sorted = [...suitKeys].sort((a, b) => ranks[b] - ranks[a]);
    target[sorted[1]] = ranks[sorted[0]];

  } else if (current.hand === 'ONE PAIR') {
    const pairGroup = groups.find(g => g.keys.length >= 2)!;
    const singles = groups.filter(g => g.keys.length === 1);
    if (pairGroup.rank >= singles[0].rank) {
      // → Three of a Kind: raise the best single to pair rank
      target[singles[0].keys[0]] = pairGroup.rank;
    } else {
      // Pair rank is weaker; → Two Pair: raise lower single to match higher single
      target[singles[singles.length - 1].keys[0]] = singles[0].rank;
    }

  } else if (current.hand === 'TWO PAIR') {
    // → Three of a Kind: raise one suit from lower pair up to higher pair rank
    const pairGroups = groups.filter(g => g.keys.length === 2).sort((a, b) => b.rank - a.rank);
    if (pairGroups.length >= 2) {
      target[pairGroups[1].keys[0]] = pairGroups[0].rank;
    }

  } else if (current.hand === 'THREE OF A KIND') {
    // → Four of a Kind: raise the lone suit to match triple
    const tripleGroup = groups.find(g => g.keys.length >= 3)!;
    const loneGroup = groups.find(g => g.keys.length === 1);
    if (loneGroup) target[loneGroup.keys[0]] = tripleGroup.rank;

  } else if (current.hand === 'STRAIGHT') {
    // → Four of a Kind: raise all suits to the max rank in the straight
    suitKeys.forEach(k => { target[k] = maxRank; });

  } else if (current.hand === 'FOUR OF A KIND') {
    // → Royal Flush: raise all suits to at least 11 (Jack)
    const royalTarget = Math.max(maxRank, 11);
    suitKeys.forEach(k => { target[k] = royalTarget; });
  }

  const targetPosture = computePosture(target);
  return { targetRanks: target, targetHand: targetPosture.hand, targetScore: targetPosture.score, isAlreadyOptimal: false };
}
