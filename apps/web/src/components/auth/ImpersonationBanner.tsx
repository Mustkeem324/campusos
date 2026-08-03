/**
 * Server-authorized impersonation is not available in this deployment.
 * A previous client-only role switcher was intentionally removed because it
 * could make the UI appear to hold privileges that the verified session lacks.
 */
export function ImpersonationBanner() {
  return null;
}
