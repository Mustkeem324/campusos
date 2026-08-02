import { describe, it, expect } from 'vitest';
import { executeAutomationRule, AutomationRule } from '../lib/automation-engine';

describe('Phase 8 Zapier-Style Workflow Automation Engine Test Suite', () => {
  it('should execute active workflow automation rule and increment count', () => {
    const rule: AutomationRule = {
      id: 'r1',
      name: 'Attendance Shortage WhatsApp Alert',
      trigger: 'ATTENDANCE_BELOW_75',
      condition: 'attendance < 75',
      action: 'POST_WHATSAPP_PARENT',
      isActive: true,
      executionCount: 0,
    };

    const res = executeAutomationRule(rule, { recordId: 'stud_101' });

    expect(res.executed).toBe(true);
    expect(rule.executionCount).toBe(1);
    expect(res.log).toContain('Action: POST_WHATSAPP_PARENT');
  });
});
