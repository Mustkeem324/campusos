// Compatibility alias for the former nested MFA route.
//
// IMPORTANT: This route must never implement its own MFA verification. The
// canonical handler requires a signed, short-lived login challenge and validates
// the user's real TOTP secret. Keeping both URLs on the same handler prevents a
// legacy endpoint from becoming an authentication downgrade path.
export { POST } from '../../mfa-verify/route';
