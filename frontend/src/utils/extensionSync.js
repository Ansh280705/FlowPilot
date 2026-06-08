/**
 * Syncs auth state with the Orvicc Chrome extension.
 * Uses externally_connectable — the extension must list this origin in its manifest.
 *
 * To find your extension ID: go to chrome://extensions while the extension is loaded.
 * Set VITE_EXTENSION_ID in frontend/.env, e.g.:
 *   VITE_EXTENSION_ID=abcdefghijklmnopabcdefghijklmnop
 */

const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID || null;

function sendToExtension(message) {
  if (!EXTENSION_ID) {
    console.warn('[Orvicc] VITE_EXTENSION_ID not set — extension sync disabled');
    return;
  }
  if (typeof chrome === 'undefined' || !chrome?.runtime?.sendMessage) {
    console.warn('[Orvicc] chrome.runtime not available — not running in Chrome');
    return;
  }
  try {
    chrome.runtime.sendMessage(EXTENSION_ID, message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Orvicc] Extension sync failed:', chrome.runtime.lastError.message);
      } else {
        console.log('[Orvicc] Extension sync response:', response);
      }
    });
  } catch (err) {
    console.warn('[Orvicc] Extension sync error:', err);
  }
}

export function syncLoginToExtension(token, user) {
  sendToExtension({ type: 'SET_AUTH_TOKEN', token, user });
}

export function syncLogoutToExtension() {
  sendToExtension({ type: 'CLEAR_AUTH_TOKEN' });
}
