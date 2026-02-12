const ENV = import.meta.env;

const configuredBase =
  ENV.VITE_API_BASE ||
  ENV.VITE_API_URL ||
  ENV.VITE_BACKEND_URL ||
  ENV.API_BASE;

const fallbackBase = "http://localhost:8000";
const normalizedBase = (configuredBase || fallbackBase).replace(/\/+$/, "");

if (!configuredBase && ENV.DEV) {
  console.warn(
    `[config] Falling back to ${fallbackBase}. Set VITE_API_BASE in your env for deployed builds.`
  );
}

export const API_BASE = normalizedBase;

console.log('[config] API_BASE set to:', API_BASE);
