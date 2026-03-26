/** Karma runs in the browser without build-time `process.env` defines; mirror dev defaults. */
const g = globalThis as typeof globalThis & { process?: { env: Record<string, string> } };
if (!g.process) {
  g.process = {
    env: {
      NG_APP_API_URL: 'http://localhost:3500/api',
      NG_APP_PRODUCTION: 'false',
    },
  };
}
