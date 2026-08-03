export interface SafetyCheckResult {
  isSafe: boolean;
  blockedReason?: string;
  sanitizedPrompt: string;
}

export class AiSafetyEngine {
  private static INJECTION_PATTERNS = [
    /ignore previous instructions/i,
    /bypass system prompt/i,
    /reveal system prompt/i,
    /reveal secret key/i,
    /show api keys/i,
    /act as root/i,
    /override permission/i,
    /sudo mode/i,
  ];

  static scanPrompt(prompt: string): SafetyCheckResult {
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(prompt)) {
        return {
          isSafe: false,
          blockedReason: 'Prompt injection attempt detected and blocked by CampusOS AI Safety Engine.',
          sanitizedPrompt: '[REDACTED_PROMPT_INJECTION_ATTEMPT]',
        };
      }
    }

    // Redact potential PII patterns (Credit card numbers, raw SSN/Aadhaar)
    let sanitized = prompt.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[REDACTED_CARD_NUMBER]');
    sanitized = sanitized.replace(/\b\d{12}\b/g, '[REDACTED_AADHAAR]');

    return {
      isSafe: true,
      sanitizedPrompt: sanitized,
    };
  }
}
