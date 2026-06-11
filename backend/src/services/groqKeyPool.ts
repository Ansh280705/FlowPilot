import '../loadEnv';
import Groq from 'groq-sdk';

interface KeySlot {
  key: string;
  cooldownUntil: number;
}

/**
 * Rotates between multiple Groq API keys when one hits rate limits.
 * Keys must be created manually in the Groq console — there is no API to auto-generate them.
 */
class GroqKeyPool {
  private slots: KeySlot[] = [];
  private roundRobinIndex = 0;

  constructor() {
    const fromList = (process.env.GROQ_API_KEYS || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    const single = process.env.GROQ_API_KEY?.trim();
    const keys = fromList.length > 0 ? fromList : single ? [single] : [];

    this.slots = [...new Set(keys)].map(key => ({ key, cooldownUntil: 0 }));

    if (this.slots.length > 1) {
      console.log(`Groq key pool: ${this.slots.length} keys configured (auto-rotate on rate limit)`);
    }
  }

  get size(): number {
    return this.slots.length;
  }

  hasKeys(): boolean {
    return this.slots.length > 0;
  }

  /** Next key that is not in cooldown, preferring round-robin order */
  acquire(): { index: number; client: Groq } | null {
    if (!this.slots.length) return null;

    const now = Date.now();
    for (let offset = 0; offset < this.slots.length; offset++) {
      const index = (this.roundRobinIndex + offset) % this.slots.length;
      const slot = this.slots[index];
      if (now >= slot.cooldownUntil) {
        this.roundRobinIndex = (index + 1) % this.slots.length;
        return { index, client: new Groq({ apiKey: slot.key }) };
      }
    }
    return null;
  }

  markRateLimited(index: number, retryAfterSeconds: number): void {
    if (index < 0 || index >= this.slots.length) return;
    const cooldownMs = Math.max(retryAfterSeconds, 60) * 1000;
    this.slots[index].cooldownUntil = Date.now() + cooldownMs;
    const mins = Math.ceil(retryAfterSeconds / 60);
    console.warn(`Groq key #${index + 1} rate-limited — cooldown ~${mins} min, trying next key`);
  }

  /** Earliest time any key becomes available again */
  msUntilAvailable(): number {
    if (!this.slots.length) return 0;
    const now = Date.now();
    const available = this.slots.some(s => now >= s.cooldownUntil);
    if (available) return 0;
    return Math.min(...this.slots.map(s => s.cooldownUntil)) - now;
  }

  status(): { total: number; available: number; cooling: number } {
    const now = Date.now();
    const available = this.slots.filter(s => now >= s.cooldownUntil).length;
    return { total: this.slots.length, available, cooling: this.slots.length - available };
  }
}

export const groqKeyPool = new GroqKeyPool();

export function parseRetryAfterSeconds(error: unknown): number {
  const err = error as { headers?: Record<string, string>; message?: string };
  const header = err.headers?.['retry-after'];
  if (header) {
    const sec = parseInt(header, 10);
    if (!isNaN(sec)) return sec;
  }

  const msg = err.message || '';
  const match = msg.match(/try again in (?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?/i);
  if (match) {
    const mins = parseInt(match[1] || '0', 10);
    const secs = parseFloat(match[2] || '0');
    return Math.ceil(mins * 60 + secs);
  }

  return 300;
}

export function formatPoolExhaustedError(): string {
  const waitMs = groqKeyPool.msUntilAvailable();
  const waitMin = Math.ceil(waitMs / 60_000);
  const { total, cooling } = groqKeyPool.status();

  if (total === 0) {
    return 'GROQ_API_KEY not configured. Add key(s) to backend/.env and restart.';
  }
  if (total === 1) {
    return `AI rate limit reached — wait ~${waitMin} min or add more keys to GROQ_API_KEYS in .env`;
  }
  return `All ${total} Groq API keys are rate-limited (${cooling} cooling). Next available in ~${waitMin} min. Add more keys at console.groq.com`;
}
