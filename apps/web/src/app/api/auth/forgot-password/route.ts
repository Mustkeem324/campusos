// Backward-compatible alias for the historical password-reset request URL.
// Keep one implementation so an older endpoint cannot become a security
// downgrade path beside the hardened canonical route.
export { POST } from '../password/forgot/route';
