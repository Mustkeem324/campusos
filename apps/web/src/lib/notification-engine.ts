export interface NotificationPayload {
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  title: string;
  body: string;
  category: 'FEES' | 'EXAMS' | 'ATTENDANCE' | 'EMERGENCY';
  isEmergency?: boolean;
}

export interface DeliveryAuditEntry {
  id: string;
  recipientId: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PUSH';
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'FALLBACK_TRIGGERED';
  attemptTimestamp: number;
  failureReason?: string;
}

// 1. Quiet Hours Evaluator (e.g., 22:00 to 07:00 local time)
export function isWithinQuietHours(
  currentTime: Date = new Date(),
  startHour = 22,
  endHour = 7
): boolean {
  const hour = currentTime.getHours();
  if (startHour > endHour) {
    return hour >= startHour || hour < endHour;
  }
  return hour >= startHour && hour < endHour;
}

// 2. Dispatch Notification with Automatic Channel Fallback (WhatsApp -> SMS -> Email)
export function dispatchOmnichannelNotification(
  payload: NotificationPayload,
  simulateWhatsAppFailure = false,
  currentTime: Date = new Date()
): { auditLog: DeliveryAuditEntry[]; finalStatus: 'SUCCESS' | 'DELAYED_QUIET_HOURS' } {
  const auditLog: DeliveryAuditEntry[] = [];

  // Check Quiet Hours (Emergency alerts bypass quiet hours!)
  if (!payload.isEmergency && isWithinQuietHours(currentTime)) {
    auditLog.push({
      id: `audit_${Date.now()}_q`,
      recipientId: payload.recipientId,
      channel: 'PUSH',
      status: 'FAILED',
      failureReason: 'Delayed due to active Quiet Hours policy (22:00 - 07:00)',
      attemptTimestamp: Date.now(),
    });
    return { auditLog, finalStatus: 'DELAYED_QUIET_HOURS' };
  }

  // Primary Channel: WhatsApp
  if (simulateWhatsAppFailure) {
    auditLog.push({
      id: `audit_${Date.now()}_wa_fail`,
      recipientId: payload.recipientId,
      channel: 'WHATSAPP',
      status: 'FAILED',
      failureReason: 'WhatsApp Business API timeout',
      attemptTimestamp: Date.now(),
    });

    // Fallback Channel 1: SMS
    auditLog.push({
      id: `audit_${Date.now()}_sms_fallback`,
      recipientId: payload.recipientId,
      channel: 'SMS',
      status: 'FALLBACK_TRIGGERED',
      attemptTimestamp: Date.now() + 500,
    });

    // Fallback Channel 2: Email
    auditLog.push({
      id: `audit_${Date.now()}_email_delivered`,
      recipientId: payload.recipientId,
      channel: 'EMAIL',
      status: 'DELIVERED',
      attemptTimestamp: Date.now() + 1000,
    });
  } else {
    auditLog.push({
      id: `audit_${Date.now()}_wa_success`,
      recipientId: payload.recipientId,
      channel: 'WHATSAPP',
      status: 'DELIVERED',
      attemptTimestamp: Date.now(),
    });
  }

  return { auditLog, finalStatus: 'SUCCESS' };
}

// 3. Emergency Panic Button Alert Broadcast (Simultaneous Multi-Channel Push)
export function triggerEmergencyCampusBroadcast(
  alertTitle: string,
  alertMessage: string
): DeliveryAuditEntry[] {
  const auditLog: DeliveryAuditEntry[] = [];
  const channels: ('WHATSAPP' | 'SMS' | 'EMAIL' | 'PUSH')[] = ['WHATSAPP', 'SMS', 'EMAIL', 'PUSH'];

  for (const ch of channels) {
    auditLog.push({
      id: `emerg_${ch}_${Date.now()}`,
      recipientId: 'BROADCAST_ALL',
      channel: ch,
      status: 'DELIVERED',
      attemptTimestamp: Date.now(),
    });
  }

  return auditLog;
}
