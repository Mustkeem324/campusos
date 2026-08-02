export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'ATTENDANCE_BELOW_75' | 'FEE_INVOICE_GENERATED' | 'GRADE_PUBLISHED';
  condition: string; // e.g. "attendance < 75"
  action: 'SEND_SMS_ALERT' | 'POST_WHATSAPP_PARENT' | 'TRIGGER_WEBHOOK';
  isActive: boolean;
  executionCount: number;
}

export function executeAutomationRule(
  rule: AutomationRule,
  payload: Record<string, any>
): { executed: boolean; log: string } {
  if (!rule.isActive) {
    return { executed: false, log: `Rule '${rule.name}' is inactive.` };
  }

  rule.executionCount += 1;

  return {
    executed: true,
    log: `[AUTOMATION EXECUTED] Trigger: ${rule.trigger} -> Action: ${rule.action} for record ${payload.recordId || 'SYS'}`,
  };
}
