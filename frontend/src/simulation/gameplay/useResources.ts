// ============================================================
// simulation/gameplay/useResources.ts
// Derived hook — reads resource state and provides
// display-ready values (percentages, danger flags, labels).
// Consume this in ResourcePanel so it doesn't re-render the
// whole table when only mana changes.
// ============================================================

import { useMemo } from 'react';
import type { PlayerResources } from '../engine/types';
import { RESOURCE_CAPS } from '../engine/types';

export interface ResourceDisplay {
  health:   ResourceBar;
  mana:     ResourceBar;
  strength: ResourceBar;
}

export interface ResourceBar {
  value:    number;   // 0–100
  max:      number;   // always 100
  pct:      number;   // 0–1 for CSS width
  label:    string;
  color:    string;   // hex
  lowAlert: boolean;  // true when value < 25
}

function makeBar(
  value: number,
  label: string,
  color: string,
  lowThreshold = 25,
): ResourceBar {
  return {
    value,
    max: RESOURCE_CAPS.health,
    pct: value / 100,
    label,
    color,
    lowAlert: value < lowThreshold,
  };
}

export function useResources(resources: PlayerResources): ResourceDisplay {
  return useMemo(() => ({
    health:   makeBar(resources.health,   'HEALTH',   '#EC4899', 25),
    mana:     makeBar(resources.mana,     'MANA',     '#3B82F6', 20),
    strength: makeBar(resources.strength, 'STRENGTH', '#10B981', 0),  // 0 is normal for strength
  }), [resources.health, resources.mana, resources.strength]);
}
