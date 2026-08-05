import { describe, expect, it } from 'vitest';

import { KNOWN_ROLES } from './registry';
import {
  PHASE6_BLUEPRINTS,
  clampPhase6Percentage,
  phase6BlueprintForRole,
} from './phase6-contracts';

describe('Dashboard UI Phase 6 role experiences', () => {
  it('provides a unique signature and layout for every known role', () => {
    const blueprints = KNOWN_ROLES.map((role) => phase6BlueprintForRole(role));

    expect(blueprints).toHaveLength(KNOWN_ROLES.length);
    expect(new Set(blueprints.map((item) => item.signature)).size).toBe(KNOWN_ROLES.length);
    expect(new Set(blueprints.map((item) => item.layout)).size).toBe(KNOWN_ROLES.length);
    expect(Object.keys(PHASE6_BLUEPRINTS).sort()).toEqual([...KNOWN_ROLES].sort());
  });

  it('requires every role experience to have an actionable and scoped narrative', () => {
    for (const role of KNOWN_ROLES) {
      const blueprint = phase6BlueprintForRole(role);
      expect(blueprint.role).toBe(role);
      expect(blueprint.title.length).toBeGreaterThan(12);
      expect(blueprint.mission.length).toBeGreaterThan(24);
      expect(blueprint.assurance.length).toBeGreaterThan(24);
      expect(blueprint.primaryAction.href.startsWith('/')).toBe(true);
      expect(blueprint.primaryAction.label.length).toBeGreaterThan(4);
    }
  });

  it('clamps progress values for accessible indicators', () => {
    expect(clampPhase6Percentage(-20)).toBe(0);
    expect(clampPhase6Percentage(49.7)).toBe(50);
    expect(clampPhase6Percentage(180)).toBe(100);
    expect(clampPhase6Percentage(Number.NaN)).toBe(0);
  });
});
