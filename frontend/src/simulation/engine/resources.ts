import type { PlayerResources, SimCard, PostureLevel, PostureState } from './types';

export function applyIncomingDamage(resources: PlayerResources, damage: number): PlayerResources {
  const blocked = Math.min(resources.strength, damage);
  const remaining = damage - blocked;
  return {
    ...resources,
    strength: Math.max(0, resources.strength - blocked),
    health: Math.max(0, resources.health - remaining),
  };
}

export function applyTurnDecay(resources: PlayerResources): PlayerResources {
  return { ...resources, strength: Math.max(0, resources.strength - 10) };
}

export function applyClubCard(resources: PlayerResources, card: SimCard): PlayerResources {
  const manaGained = Math.round(card.power * 0.8);
  return { ...resources, mana: Math.min(100, resources.mana + manaGained) };
}

export function applyHeartCard(resources: PlayerResources, card: SimCard): PlayerResources {
  const healthGained = Math.round(card.power * 1.5);
  const manaBonus = Math.round(card.power * 0.3);
  return {
    ...resources,
    health: Math.min(100, resources.health + healthGained),
    mana: Math.min(100, resources.mana + manaBonus),
  };
}

export function applyDiamondCard(
  resources: PlayerResources,
  card: SimCard
): { resources: PlayerResources; attackBlocked: boolean; extraTurn: boolean } {
  const strengthGain = Math.round(card.power / 4);
  const attackBlocked = Math.random() < 0.10;
  const extraTurn = Math.random() < 0.20;
  return {
    resources: {
      ...resources,
      mana: Math.max(0, resources.mana - card.manaCost),
      strength: Math.min(100, resources.strength + strengthGain),
    },
    attackBlocked,
    extraTurn,
  };
}

export function computeSimPosture(resources: PlayerResources): PostureState {
  const score = Math.round(resources.health * 0.5 + resources.mana * 0.3 + resources.strength * 0.2);
  let level: PostureLevel;
  if (score >= 80) level = 'secure';
  else if (score >= 60) level = 'stable';
  else if (score >= 40) level = 'strained';
  else if (score >= 20) level = 'critical';
  else level = 'breached';
  return { level, score };
}
