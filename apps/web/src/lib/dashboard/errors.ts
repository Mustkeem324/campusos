/**
 * Typed error raised by dashboard loaders when a request cannot be served.
 *
 * Carries an explicit HTTP status so API routes never need to guess status
 * codes from error-message text:
 *   - 401 → unauthenticated (no valid session context)
 *   - 403 → authenticated but not authorised for this dashboard or role
 *   - 500 → unexpected server failure
 */
export class DashboardError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'DashboardError';
  }
}
