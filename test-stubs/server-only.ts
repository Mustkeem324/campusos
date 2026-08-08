// No-op stub for the `server-only` marker package.
//
// Next.js virtualizes `server-only` at build time (importing it from a client
// bundle throws). Vitest runs outside Next.js and cannot resolve the package,
// so tests alias `server-only` to this module. A side-effect-only import of a
// server library in a unit test is exactly the server context this marker
// guards, so the empty export is intentional and safe.
export {};
