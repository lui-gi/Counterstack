// ============================================================
// simulation/gameplay/useCampaign.ts
// 3-boss campaign engine:  System Patch → Wesker → AI Adapter
//
// Diamond mechanic: 0 direct damage — accumulates a damage
//   charge that is consumed by the next Spade attack.
//
// Wesker isolation: 3 Diamonds break isolation layers →
//   Wesker becomes Stunned (2 free player turns, full damage).
//
// AI Adapter: Full damage dealt, but heals +30 each attack.
//   Jackpot is the only way to finish him.
// ============================================================

import { useReducer, useCallback, useEffect } from 'react';

export type Suit = 'spades' | 'clubs' | 'diamonds' | 'hearts';
export type BossId = 'system-patch' | 'wesker' | 'ai-adapter';

export interface CampaignCard {
  suit: Suit;
  rank: number;   // 1=Ace, 2-10, 11=J, 12=Q, 13=K
  id: string;
}

export type CampaignPhase =
  | 'boss-intro'      // entrance dialogue
  | 'player-draw'     // waiting for DRAW click
  | 'card-select'     // showing N card options
  | 'resolve'         // auto: brief pause after play
  | 'enemy-attack'    // auto: boss hits player
  | 'defeat-pending'  // auto: 1s delay before showing defeat screen
  | 'phase-clear'     // boss defeated, click CONTINUE
  | 'victory'
  | 'game-over';

export interface CampaignBoss {
  id: BossId;
  name: string;
  maxHp: number;
  hp: number;
  atkMin: number;
  atkMax: number;
  sprite: string;
  introText: string;
}

export interface CampaignLogEntry {
  id: string;
  msg: string;
  kind: 'info' | 'damage' | 'enemy' | 'boss' | 'jackpot';
}

export interface CampaignState {
  phase: CampaignPhase;
  bossIndex: number;
  boss: CampaignBoss;
  playerHp: number;
  playerMaxHp: number;
  turn: number;
  jackpotAvailable: boolean;
  jackpotUsed: boolean;
  deck: CampaignCard[];
  discard: CampaignCard[];
  drawnCard: CampaignCard | null;
  cardOptions: CampaignCard[];
  lastPlayerDmg: number;
  lastBossDmg: number;
  diamondsUsed: number;
  dialogueText: string | null;
  log: CampaignLogEntry[];
  // Per-boss resources (reset each phase)
  usedCards: string[];        // card IDs played (rank 2 is never added — always available)
  defenseStacks: number;      // armor accumulated via diamonds
  handRanks: Record<Suit, number>; // per-suit card ranks (set from SOC or default)
  mana: number;               // current mana (max = clubs rank)
  manaMax: number;            // clubs card rank
  lastAttackMsg: string;      // boss flavor text for most recent attack
  systemCompromised: boolean; // true when player uses non-spade vs System Patch
  // Diamond charge mechanic
  diamondCharge: number;      // damage bonus banked by diamonds, consumed by next spade
  // Wesker isolation mechanic
  weskerExposed: boolean;     // true after 3 diamonds break isolation
  weskerStunTurnsLeft: number; // player turns where Wesker can't attack (stun window)
  // AI Adapter healing flash
  adapterAdapting: boolean;   // true for 1s after adapter heals, shown as "ADAPTING"
}

// ── Per-boss defeat messages ──────────────────────────────────
const DEFEAT_MESSAGES: Record<BossId, string> = {
  'system-patch': 'Threat confirmed. Escalating response...',
  'wesker':       'Threat contained. Initiating purge...',
  'ai-adapter':   'Breach contained!',
};

// ── Static boss data ─────────────────────────────────────────
const BOSS_DATA: CampaignBoss[] = [
  {
    id: 'system-patch', name: 'UNPATCHED VULNERABILITY',
    maxHp: 40, hp: 40, atkMin: 5, atkMax: 9,
    sprite: '🛡️',
    introText: 'CRITICAL PATCH WINDOW DETECTED. Security protocols corrupted. Initiating hostile containment...',
  },
  {
    id: 'wesker', name: 'Weslock.exe',
    maxHp: 50, hp: 50, atkMin: 12, atkMax: 20,
    sprite: '👤',
    introText: '7 minutes. 7 minutes is all I can spare to play with you.',
  },
  {
    id: 'ai-adapter', name: 'AI ADAPTER',
    maxHp: 120, hp: 120, atkMin: 12, atkMax: 20,
    sprite: '🤖',
    introText: 'This is how we\'re gonna do it, roses are red, weapons against me won\'t prosutre, with this sacred treasure, BIG RAGA!! THE OPP STAPA.',
  },
];

// ── Helpers ──────────────────────────────────────────────────
export function rankDisplay(rank: number): string {
  const m: Record<number, string> = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  return m[rank] ?? String(rank);
}

export function rankValue(rank: number): number {
  return rank === 1 ? 14 : rank;
}

export function suitSym(suit: Suit): string {
  return { spades: '♠', clubs: '♣', diamonds: '♦', hearts: '♥' }[suit];
}

export function suitColor(suit: Suit): string {
  return { spades: '#4da6ff', clubs: '#33dd77', diamonds: '#cc88ff', hearts: '#ff4455' }[suit];
}

function buildDeck(): CampaignCard[] {
  const suits: Suit[] = ['spades', 'clubs', 'diamonds', 'hearts'];
  return suits.flatMap(suit =>
    Array.from({ length: 13 }, (_, i) => ({ suit, rank: i + 1, id: `${suit}-${i + 1}` }))
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rollAtk(boss: CampaignBoss): number {
  return boss.atkMin + Math.floor(Math.random() * (boss.atkMax - boss.atkMin + 1));
}

// ── Structured boss attacks ───────────────────────────────────
type AttackType = 'normal' | 'penetrating' | 'heavy' | 'double' | 'mana-drain' | 'reflected';

interface BossAttack {
  name: string;
  text: string;
  type: AttackType;
}

const SYSTEM_PATCH_ATTACKS: BossAttack[] = [
  { name: 'CVE Exploit',      text: '[CVE-2024-1188] Exploiting unpatched RCE in Salesforce API gateway — customer data segment breached.',      type: 'normal'      },
  { name: 'Lateral Move',     text: '[LATERAL MOVE] Pivoting from AWS S3 misconfiguration into internal Slack workspace — comms compromised.',    type: 'normal'      },
  { name: 'Supply Chain',     text: '[SUPPLY CHAIN] Malicious npm package injected into CI/CD pipeline — GitHub Actions poisoned.',               type: 'heavy'       },
  { name: 'Credential Dump',  text: '[CREDENTIAL DUMP] OAuth tokens harvested from Okta SSO — all SaaS sessions now exposed.',                    type: 'mana-drain'  },
  { name: 'Network Seg',      text: '[NETWORK SEG] East-west firewall rule bypassed — attacker spreading across VPC subnet 10.0.4.0/24.',          type: 'normal'      },
  { name: 'Log Tamper',       text: '[LOG TAMPER] CloudTrail logging disabled in us-east-1 — evidence erased, audit trail gone dark.',             type: 'penetrating' },
  { name: 'Ransomware',       text: '[RANSOMWARE] Encrypting SharePoint library and Google Workspace Drive — ransom demand incoming.',              type: 'heavy'       },
  { name: 'DNS Hijack',       text: '[DNS HIJACK] Corporate DNS poisoned — Microsoft 365 login portal redirecting to phishing endpoint.',          type: 'normal'      },
];

const WESKER_ATTACKS: BossAttack[] = [
  { name: 'Kernel Breach',        text: '⚠️ Kernel breached — system compromised!',              type: 'normal'      },
  { name: 'Cloaked Strike',       text: '🕵️ Attack from hidden layer...',                        type: 'heavy'       },
  { name: 'Memory Corruption',    text: '☠️ Corrupting memory blocks...',                         type: 'normal'      },
  { name: 'Privileged Execution', text: '⬆️ Executing with elevated privileges!',                type: 'heavy'       },
  { name: 'Process Hijack',       text: '🧬 Hijacking system process...',                         type: 'mana-drain'  },
  { name: 'Backdoor Surge',       text: '🕳️ Backdoor access exploited!',                          type: 'penetrating' },
  { name: 'Root Access Slam',     text: '⚡ ROOT ACCESS ENGAGED!',                                type: 'double'      },
];

const AI_ADAPTER_ATTACKS: BossAttack[] = [
  { name: 'Counter Strike',    text: '📊 Countering your pattern!',            type: 'reflected'   },
  { name: 'Reflected Attack',  text: '🔁 Reflecting your move!',               type: 'reflected'   },
  { name: 'Predicted Hit',     text: '🔮 Move predicted — strike confirmed.',  type: 'penetrating' },
  { name: 'Overclock Burst',   text: '⚡ Processing speed maximized!',          type: 'double'      },
  { name: 'Neural Spike',      text: '🧠 Neural spike initiated...',            type: 'normal'      },
  { name: 'Data Drain',        text: '🔄 Draining system resources...',         type: 'mana-drain'  },
];

const BOSS_ATTACKS: Record<BossId, BossAttack[]> = {
  'system-patch': SYSTEM_PATCH_ATTACKS,
  'wesker':       WESKER_ATTACKS,
  'ai-adapter':   AI_ADAPTER_ATTACKS,
};

function makeInitial(ranks: Record<Suit, number> = FIXED_HAND_RANKS): CampaignState {
  const boss = { ...BOSS_DATA[0] };
  const avgRank = Object.values(ranks).reduce((a, b) => a + b, 0) / 4;
  const hp = Math.round(50 + (avgRank / 13) * 50);
  return {
    phase: 'boss-intro', bossIndex: 0, boss,
    playerHp: hp, playerMaxHp: hp, turn: 0,
    jackpotAvailable: false, jackpotUsed: false,
    deck: shuffle(buildDeck()), discard: [],
    drawnCard: null, cardOptions: [],
    lastPlayerDmg: 0, lastBossDmg: 0,
    diamondsUsed: 0, dialogueText: boss.introText,
    usedCards: [], defenseStacks: 0,
    handRanks: ranks,
    manaMax: ranks.clubs,
    mana: ranks.clubs,
    lastAttackMsg: '',
    systemCompromised: false,
    diamondCharge: 0,
    weskerExposed: false,
    weskerStunTurnsLeft: 0,
    adapterAdapting: false,
    log: [{ id: 'init', msg: '[SYSTEM] Campaign started. Phase 1: System Patch.', kind: 'info' }],
  };
}

// ── Fixed card ranks ──────────────────────────────────────────
export const FIXED_HAND_RANKS: Record<Suit, number> = {
  spades:   9,
  clubs:    8,
  diamonds: 7,
  hearts:   10,
};

// ── Mana cost per card rank ───────────────────────────────────
export function manaCost(rank: number): number {
  const v = rankValue(rank);
  if (v <= 3) return 1;
  if (v <= 6) return 2;
  return 3;
}

// ── Actions ──────────────────────────────────────────────────
type Action =
  | { type: 'START' }
  | { type: 'CONTINUE_INTRO' }
  | { type: 'DRAW_CARD' }
  | { type: 'DRAW_SUIT'; suit: Suit }
  | { type: 'SELECT_CARD'; cardId: string }
  | { type: 'ADVANCE' }
  | { type: 'TRIGGER_JACKPOT' }
  | { type: 'WESKER_TIMEOUT' }
  | { type: 'DEFEAT_CONFIRM' };

// ── Reducer ──────────────────────────────────────────────────
function reducer(state: CampaignState, action: Action): CampaignState {
  function addLog(...entries: CampaignLogEntry[]): CampaignLogEntry[] {
    return [...entries, ...state.log].slice(0, 60);
  }

  switch (action.type) {

    case 'START':
      return makeInitial(state.handRanks);

    case 'CONTINUE_INTRO': {
      if (state.phase !== 'boss-intro') return state;
      return { ...state, phase: 'player-draw', dialogueText: null };
    }

    case 'DRAW_CARD': {
      if (state.phase !== 'player-draw') return state;
      let deck = [...state.deck];
      let discard = [...state.discard];
      if (deck.length === 0) { deck = shuffle(discard); discard = []; }

      const drawn = deck[0];
      const remaining = deck.slice(1);
      const count = rankValue(drawn.rank);

      const pool = shuffle([...remaining, ...discard].filter(c => c.suit === drawn.suit));
      const options = pool.length > 0 ? pool.slice(0, count) : [drawn];
      const putDrawnInDiscard = !options.includes(drawn);

      const newTurn = state.turn + 1;
      return {
        ...state,
        phase: 'card-select',
        deck: remaining,
        discard: putDrawnInDiscard ? [...discard, drawn] : discard,
        drawnCard: drawn,
        cardOptions: options,
        turn: newTurn,
        jackpotAvailable: newTurn >= 13 && !state.jackpotUsed,
        log: addLog({
          id: `draw-${newTurn}`,
          msg: `[T${newTurn}] Drew ${rankDisplay(drawn.rank)}${suitSym(drawn.suit)} — ${options.length} ${drawn.suit} cards revealed`,
          kind: 'info',
        }),
      };
    }

    case 'DRAW_SUIT': {
      if (state.phase !== 'player-draw' && state.phase !== 'card-select') return state;
      const suit   = action.suit;
      const rank   = state.handRanks[suit];
      // Options = cards numbered 2..rank, excluding used ones (rank 2 is always included)
      const options: CampaignCard[] = Array.from({ length: rank - 1 }, (_, i) => ({
        suit, rank: i + 2, id: `${suit}-pick-${i + 2}`,
      })).filter(c => c.rank === 2 || !state.usedCards.includes(c.id));

      const switching = state.phase === 'card-select';
      const newTurn   = switching ? state.turn : state.turn + 1;
      const newLog    = switching ? state.log : addLog({
        id: `draw-${newTurn}`,
        msg: `[T${newTurn}] ${rankDisplay(rank)}${suitSym(suit)} drawn — choose power 2–${rank}`,
        kind: 'info',
      });
      return {
        ...state,
        phase: 'card-select',
        drawnCard: { suit, rank, id: `${suit}-${rank}` },
        cardOptions: options,
        turn: newTurn,
        jackpotAvailable: newTurn >= 13 && !state.jackpotUsed,
        log: newLog,
      };
    }

    case 'SELECT_CARD': {
      if (state.phase !== 'card-select') return state;
      const card = state.cardOptions.find(c => c.id === action.cardId);
      if (!card) return state;

      const usedCards = card.rank === 2
        ? state.usedCards
        : [...state.usedCards, card.id];
      const baseDiscard = [...state.discard, ...state.cardOptions];

      // ── System Patch: non-spade = instant loss ──────────────
      if (state.boss.id === 'system-patch' && card.suit !== 'spades') {
        return {
          ...state,
          phase: 'game-over',
          playerHp: 0,
          systemCompromised: true,
          usedCards,
          lastPlayerDmg: 0,
          discard: baseDiscard,
          cardOptions: [], drawnCard: null,
          log: addLog({
            id: `compromised-${state.turn}`,
            msg: `[SYSTEM COMPROMISED] ${suitSym(card.suit)} exploited by System Patch — patch logic inverted your defenses. SYSTEM LOST.`,
            kind: 'enemy',
          }),
        };
      }

      // ── Clubs: restore mana (free) ──────────────────────────
      if (card.suit === 'clubs') {
        const manaGain = rankValue(card.rank);
        const newMana  = Math.min(state.manaMax, state.mana + manaGain);
        return {
          ...state,
          phase: 'resolve',
          mana: newMana,
          jackpotAvailable: state.turn >= 13 && !state.jackpotUsed,
          usedCards,
          lastPlayerDmg: 0,
          discard: baseDiscard,
          cardOptions: [], drawnCard: null,
          log: addLog({ id: `play-${state.turn}`, msg: `[MANA] ${rankDisplay(card.rank)}♣ — +${manaGain} mana (${newMana}/${state.manaMax})`, kind: 'info' }),
        };
      }

      // All other suits cost mana
      const cost = manaCost(card.rank);
      if (state.mana < cost) return state;

      // ── Hearts: heal player ─────────────────────────────────
      if (card.suit === 'hearts') {
        const healAmt     = Math.round(rankValue(card.rank) * 5);
        const newPlayerHp = Math.min(state.playerMaxHp, state.playerHp + healAmt);
        return {
          ...state,
          phase: 'resolve',
          playerHp: newPlayerHp,
          mana: state.mana - cost,
          usedCards,
          lastPlayerDmg: 0,
          discard: baseDiscard,
          cardOptions: [], drawnCard: null,
          log: addLog({ id: `play-${state.turn}`, msg: `[RECOVER] ${rankDisplay(card.rank)}♥ — Healed ${healAmt} HP · −${cost} mana`, kind: 'info' }),
        };
      }

      // ── Diamonds: 0 direct damage — bank a charge bonus ────
      if (card.suit === 'diamonds') {
        const chargeGain      = rankValue(card.rank);
        const newCharge       = state.diamondCharge + chargeGain;
        const newDiamondsUsed = state.diamondsUsed + 1;
        const newDefense      = state.defenseStacks + rankValue(card.rank);

        // Wesker: 3 diamonds break isolation → stun him for 2 player turns
        let weskerExposed       = state.weskerExposed;
        let weskerStunTurnsLeft = state.weskerStunTurnsLeft;
        let exposureMsg = '';
        if (state.boss.id === 'wesker' && !weskerExposed && newDiamondsUsed >= 3) {
          weskerExposed       = true;
          weskerStunTurnsLeft = 2;
          exposureMsg = ' — ⚠️ WESKER CAUGHT AND STUNNED! 2 FREE ATTACK TURNS!';
        }

        const layersLeft = state.boss.id === 'wesker' && !weskerExposed
          ? Math.max(0, 3 - newDiamondsUsed)
          : null;
        const layerStr = layersLeft !== null ? ` [${layersLeft}/3 isolation layers remaining]` : '';

        return {
          ...state,
          phase: 'resolve',
          mana: state.mana - cost,
          diamondsUsed:       newDiamondsUsed,
          diamondCharge:      newCharge,
          defenseStacks:      newDefense,
          weskerExposed,
          weskerStunTurnsLeft,
          usedCards,
          lastPlayerDmg: 0,
          discard: baseDiscard,
          cardOptions: [], drawnCard: null,
          log: addLog({
            id: `play-${state.turn}`,
            msg: `[ISOLATE BREAK] ${rankDisplay(card.rank)}♦ — +${chargeGain} DMG CHARGE (total: ${newCharge}) · +${rankValue(card.rank)} ARMOR${layerStr}${exposureMsg} · −${cost} mana`,
            kind: 'damage',
          }),
        };
      }

      // ── Spades: attack with diamond-charge bonus ────────────
      if (card.suit === 'spades') {
        const baseDmg    = rankValue(card.rank);
        const chargeBonus = state.diamondCharge;
        const totalDmg   = baseDmg + chargeBonus;

        let newHp: number;
        let bossNote = '';

        if (state.boss.id === 'system-patch') {
          newHp = 0;
        } else if (state.boss.id === 'wesker') {
          if (state.weskerExposed) {
            newHp    = Math.max(0, state.boss.hp - totalDmg);
            bossNote = state.weskerStunTurnsLeft > 1
              ? ` [STUNNED: ${state.weskerStunTurnsLeft} free turns left]`
              : ' [STUN ENDING]';
          } else {
            // Not exposed — hard HP floor, can never drop below 5
            newHp    = Math.max(5, state.boss.hp - totalDmg);
            bossNote = ' [ISOLATION ACTIVE — use ♦ to break]';
          }
        } else if (state.boss.id === 'ai-adapter') {
          // Full damage — but adapter heals every attack turn
          newHp    = Math.max(1, state.boss.hp - totalDmg);
          bossNote = ' [ADAPTING — jackpot required to finish]';
        } else {
          newHp = Math.max(0, state.boss.hp - totalDmg);
        }

        const boss        = { ...state.boss, hp: newHp };
        const bossDefeated = newHp === 0;
        const chargeStr    = chargeBonus > 0 ? ` (+${chargeBonus} charge bonus)` : '';

        return {
          ...state,
          phase: bossDefeated ? 'defeat-pending' : 'resolve',
          dialogueText: bossDefeated ? DEFEAT_MESSAGES[state.boss.id] : state.dialogueText,
          boss,
          lastPlayerDmg: totalDmg,
          mana: state.mana - cost,
          diamondCharge: 0, // charge consumed on spade
          usedCards,
          discard: baseDiscard,
          cardOptions: [], drawnCard: null,
          log: addLog({
            id: `play-${state.turn}`,
            msg: `[OFFENSIVE] ${rankDisplay(card.rank)}♠ — ${baseDmg} base${chargeStr} = ${totalDmg} DMG · −${cost} mana → ${state.boss.name} ${newHp}/${state.boss.maxHp} HP${bossNote}`,
            kind: 'damage',
          }),
        };
      }

      return state;
    }

    case 'ADVANCE': {
      if (state.phase === 'resolve') {
        // ── Wesker stun: skip enemy attack entirely, give player a free turn ──
        if (state.boss.id === 'wesker' && state.weskerStunTurnsLeft > 0) {
          const newStun      = state.weskerStunTurnsLeft - 1;
          const stillExposed = newStun > 0;
          const stunMsg      = newStun > 0
            ? `[WESKER STUNNED] ${newStun} free attack turn${newStun !== 1 ? 's' : ''} remaining — ATTACK NOW!`
            : '[WESKER STUN ENDING] Last free turn used — he recovers next round!';
          return {
            ...state,
            phase: 'player-draw',
            weskerStunTurnsLeft: newStun,
            weskerExposed: stillExposed,
            log: addLog({ id: `stun-${state.turn}`, msg: stunMsg, kind: 'boss' }),
          };
        }

        const attacks   = BOSS_ATTACKS[state.boss.id];
        const atk       = attacks[Math.floor(Math.random() * attacks.length)];
        const rawDmg    = rollAtk(state.boss);

        // ── Apply attack type effects ──
        let dmg     = rawDmg;
        let manaDrain = 0;
        let reduction = 0;

        switch (atk.type) {
          case 'penetrating':
            dmg = Math.max(1, rawDmg);
            reduction = 0;
            break;
          case 'heavy':
            dmg = Math.ceil(rawDmg * 1.5);
            reduction = Math.min(state.defenseStacks, dmg - 1);
            dmg = Math.max(1, dmg - reduction);
            break;
          case 'double':
            dmg = rawDmg + rollAtk(state.boss);
            reduction = Math.min(state.defenseStacks, dmg - 1);
            dmg = Math.max(1, dmg - reduction);
            break;
          case 'mana-drain':
            // Wesker always ignores defense
            reduction = state.boss.id === 'wesker' ? 0 : Math.min(state.defenseStacks, rawDmg - 1);
            dmg = Math.max(1, rawDmg - reduction);
            manaDrain = 2;
            break;
          case 'reflected':
            dmg = Math.max(state.boss.atkMin, state.lastPlayerDmg);
            reduction = Math.min(state.defenseStacks, dmg - 1);
            dmg = Math.max(1, dmg - reduction);
            break;
          default: // 'normal'
            // Wesker always ignores defense
            reduction = state.boss.id === 'wesker' ? 0 : Math.min(state.defenseStacks, rawDmg - 1);
            dmg = Math.max(1, rawDmg - reduction);
        }

        const newPlayerHp = Math.max(0, state.playerHp - dmg);
        const newMana     = Math.max(0, state.mana - manaDrain);

        // AI Adapter heals +30 each attack (adapts back)
        let boss = { ...state.boss };
        let adapterAdapting = false;
        if (boss.id === 'ai-adapter') {
          boss.hp = Math.min(boss.maxHp, boss.hp + 30);
          adapterAdapting = true;
        }

        const blockMsg  = reduction > 0 ? ` (${reduction} blocked)` : '';
        const drainMsg  = manaDrain > 0 ? ` · −${manaDrain} mana stolen` : '';

        return {
          ...state,
          phase: newPlayerHp === 0 ? 'game-over' : 'enemy-attack',
          playerHp:      newPlayerHp,
          mana:          newMana,
          boss,
          lastBossDmg:   dmg,
          lastAttackMsg: `${atk.name}: ${atk.text}`,
          adapterAdapting,
          log: addLog({
            id: `atk-${state.turn}`,
            msg: `[${state.boss.name} — ${atk.name}] ${atk.text} ${rawDmg}${blockMsg} = ${dmg} dmg${drainMsg} — Player HP: ${newPlayerHp}/${state.playerMaxHp}`,
            kind: 'enemy',
          }),
        };
      }

      if (state.phase === 'enemy-attack') {
        return { ...state, phase: 'player-draw', systemCompromised: false, adapterAdapting: false };
      }

      if (state.phase === 'phase-clear') {
        const next = state.bossIndex + 1;
        if (next >= BOSS_DATA.length) return { ...state, phase: 'victory' };
        const nextBoss = { ...BOSS_DATA[next] };
        return {
          ...state,
          phase: 'boss-intro', bossIndex: next, boss: nextBoss,
          diamondsUsed: 0, jackpotAvailable: false, jackpotUsed: false,
          usedCards: [], defenseStacks: 0,
          mana: state.manaMax, manaMax: state.manaMax,
          lastAttackMsg: '', systemCompromised: false,
          diamondCharge: 0,
          weskerExposed: false, weskerStunTurnsLeft: 0,
          adapterAdapting: false,
          dialogueText: nextBoss.introText,
          log: addLog({ id: `phase${next}`, msg: `[PHASE ${next + 1}] ${nextBoss.name} enters the arena!`, kind: 'boss' }),
        };
      }

      return state;
    }

    case 'TRIGGER_JACKPOT': {
      if (!state.jackpotAvailable || state.jackpotUsed) return state;

      if (state.boss.id === 'ai-adapter') {
        return {
          ...state,
          phase: 'defeat-pending', jackpotUsed: true, jackpotAvailable: false,
          dialogueText: DEFEAT_MESSAGES['ai-adapter'],
          boss: { ...state.boss, hp: 0 }, lastPlayerDmg: state.boss.maxHp,
          log: addLog({ id: `jackpot-${state.turn}`, msg: '[BLACK HAT JACKPOT] 🎩 SYSTEM OVERRIDE! AI ADAPTER DESTROYED!', kind: 'jackpot' }),
        };
      }

      const bonusDmg = 30 + Math.floor(Math.random() * 20);
      const newHp = Math.max(0, state.boss.hp - bonusDmg);
      return {
        ...state,
        phase: newHp === 0 ? 'defeat-pending' : 'resolve',
        dialogueText: newHp === 0 ? DEFEAT_MESSAGES[state.boss.id] : state.dialogueText,
        jackpotUsed: true, jackpotAvailable: false,
        boss: { ...state.boss, hp: newHp }, lastPlayerDmg: bonusDmg,
        log: addLog({ id: `jackpot-${state.turn}`, msg: `[BLACK HAT JACKPOT] 🎩 ${bonusDmg} DAMAGE to ${state.boss.name}!`, kind: 'jackpot' }),
      };
    }

    case 'DEFEAT_CONFIRM': {
      if (state.phase !== 'defeat-pending') return state;
      return { ...state, phase: 'phase-clear' };
    }

    case 'WESKER_TIMEOUT': {
      if (state.boss.id !== 'wesker') return state;
      if (state.phase === 'defeat-pending' || state.phase === 'phase-clear' || state.phase === 'victory' || state.phase === 'game-over') return state;
      return {
        ...state,
        phase: 'game-over',
        log: addLog({
          id: `wesker-timeout-${state.turn}`,
          msg: '"7 minutes." — WESKER\'S TIMER EXPIRED. SYSTEM COMPROMISED.',
          kind: 'enemy',
        }),
      };
    }

    default: return state;
  }
}

// ── Public hook ──────────────────────────────────────────────
export function useCampaign(initialRanks?: Record<Suit, number>) {
  const ranks = initialRanks ?? FIXED_HAND_RANKS;
  const [state, dispatch] = useReducer(reducer, ranks, makeInitial);

  useEffect(() => { dispatch({ type: 'START' }); }, []);

  // 1-second delay between defeat and showing the defeat screen
  useEffect(() => {
    if (state.phase !== 'defeat-pending') return;
    const t = setTimeout(() => dispatch({ type: 'DEFEAT_CONFIRM' }), 1000);
    return () => clearTimeout(t);
  }, [state.phase]);

  const continueIntro  = useCallback(() => dispatch({ type: 'CONTINUE_INTRO' }), []);
  const drawCard       = useCallback(() => dispatch({ type: 'DRAW_CARD' }), []);
  const drawSuit       = useCallback((suit: Suit) => dispatch({ type: 'DRAW_SUIT', suit }), []);
  const selectCard     = useCallback((id: string) => dispatch({ type: 'SELECT_CARD', cardId: id }), []);
  const advance        = useCallback(() => dispatch({ type: 'ADVANCE' }), []);
  const triggerJackpot = useCallback(() => dispatch({ type: 'TRIGGER_JACKPOT' }), []);
  const weskerTimeout  = useCallback(() => dispatch({ type: 'WESKER_TIMEOUT' }), []);
  const restart        = useCallback(() => dispatch({ type: 'START' }), []);

  return { state, continueIntro, drawCard, drawSuit, selectCard, advance, triggerJackpot, weskerTimeout, restart };
}
