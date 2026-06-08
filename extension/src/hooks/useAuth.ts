import { useState, useEffect } from 'react';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3002/api';
const TOKEN_KEY = 'fp_token';
const USER_KEY  = 'fp_user';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  plan: 'free' | 'pro' | 'enterprise';
}

// ── chrome.storage.local helpers ────────────────────────────────────────────

function storageGet<T>(key: string): Promise<T | null> {
  return new Promise(resolve => {
    chrome.storage.local.get([key], result => {
      resolve(result[key] ?? null);
    });
  });
}

function storageSet(key: string, value: unknown): Promise<void> {
  return new Promise(resolve => chrome.storage.local.set({ [key]: value }, resolve));
}

function storageRemove(keys: string[]): Promise<void> {
  return new Promise(resolve => chrome.storage.local.remove(keys, resolve));
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const token = await storageGet<string>(TOKEN_KEY);

      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      // Show cached user immediately while we verify
      const cached = await storageGet<AuthUser>(USER_KEY);
      if (cached && !cancelled) setUser(cached);

      try {
        const res = await fetch(`${BACKEND_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Unauthorized');
        const u: AuthUser = await res.json();
        await storageSet(USER_KEY, u);
        if (!cancelled) setUser(u);
      } catch {
        await storageRemove([TOKEN_KEY, USER_KEY]);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    // Listen for token pushed from the website (via externally_connectable)
    const onMessage = (
      message: { type: string; token?: string; user?: AuthUser },
      _sender: chrome.runtime.MessageSender,
      sendResponse: (r: unknown) => void
    ) => {
      if (message.type === 'SET_AUTH_TOKEN' && message.token && message.user) {
        storageSet(TOKEN_KEY, message.token)
          .then(() => storageSet(USER_KEY, message.user!))
          .then(() => {
            if (!cancelled) setUser(message.user!);
            sendResponse({ success: true });
          });
        return true; // async
      }
      if (message.type === 'CLEAR_AUTH_TOKEN') {
        storageRemove([TOKEN_KEY, USER_KEY]).then(() => {
          if (!cancelled) setUser(null);
          sendResponse({ success: true });
        });
        return true;
      }
    };

    chrome.runtime.onMessage.addListener(onMessage);
    return () => {
      cancelled = true;
      chrome.runtime.onMessage.removeListener(onMessage);
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const { token, user: u } = await res.json();
    await storageSet(TOKEN_KEY, token);
    await storageSet(USER_KEY, u);
    setUser(u);
    return u;
  };

  const register = async (email: string, password: string, name: string, plan = 'free'): Promise<AuthUser> => {
    const res = await fetch(`${BACKEND_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, plan }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    const { token, user: u } = await res.json();
    await storageSet(TOKEN_KEY, token);
    await storageSet(USER_KEY, u);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await storageRemove([TOKEN_KEY, USER_KEY]);
    setUser(null);
  };

  const getToken = (): Promise<string | null> => storageGet<string>(TOKEN_KEY);

  return { user, loading, login, register, logout, getToken };
}
