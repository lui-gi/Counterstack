import type { SimulationState, SimCard, SimLogEntry } from './types';
import { applyClubCard, applyHeartCard, applyDiamondCard } from './resources';

function makeLog(text: string, severity: SimLogEntry['severity'], turn: number): SimLogEntry {
  return { id: `log-${Date.now()}-${Math.random()}`, text, severity, turn };
}

export function resolveCardPlay(state: SimulationState, card: SimCard): SimulationState {
  let { resources, activeThreat, log, discardPile, hand, attackBlocked, extraTurnAvailable } = state;

  if (!activeThreat) return state;

  const newHand = hand.filter(c => c.id !== card.id);
  const newDiscard = [...discardPile, card];
  const newLog = [...log];

  if (card.suit === 'spade') {
    const damage = Math.round(card.power * (1 - activeThreat.evasion));
    const newHp = Math.max(0, activeThreat.hp - damage);
    newLog.push(makeLog(`▶ ${card.actionName} deals ${damage} damage to ${activeThreat.name}`, 'danger', state.turn));
    activeThreat = { ...activeThreat, hp: newHp };
    resources = { ...resources, mana: Math.max(0, resources.mana - card.manaCost) };
  } else if (card.suit === 'club') {
    resources = applyClubCard(resources, card);
    newLog.push(makeLog(`▶ ${card.actionName} restores ${Math.round(card.power * 0.8)} mana`, 'info', state.turn));
  } else if (card.suit === 'heart') {
    resources = applyHeartCard(resources, card);
    newLog.push(makeLog(`▶ ${card.actionName} restores ${Math.round(card.power * 1.5)} health`, 'success', state.turn));
  } else if (card.suit === 'diamond') {
    const result = applyDiamondCard(resources, card);
    resources = result.resources;
    attackBlocked = result.attackBlocked;
    extraTurnAvailable = result.extraTurn;
    newLog.push(makeLog(
      `▶ ${card.actionName} adds ${Math.round(card.power / 4)} strength${result.extraTurn ? ' (EXTRA TURN!)' : ''}`,
      'info',
      state.turn
    ));
  }

  const nextPhase = extraTurnAvailable ? 'choose' : 'enemy-respond';

  return {
    ...state,
    resources,
    activeThreat,
    hand: newHand,
    discardPile: newDiscard,
    log: newLog,
    attackBlocked,
    extraTurnAvailable: false,
    phase: nextPhase,
  };
}
