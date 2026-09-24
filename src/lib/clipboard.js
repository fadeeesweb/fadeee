export async function copyText(text) {
  if (typeof text !== 'string' || text.length === 0) return false;
  try {
    if (navigator.clipboard && window.isSecureContext !== false) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    // Permission denied or unavailable - fall through to the legacy path.
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.setAttribute('aria-hidden', 'true');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch (error) {
    return false;
  }
}

export async function readClipboardText() {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const value = await navigator.clipboard.readText();
      return { ok: true, text: typeof value === 'string' ? value : '' };
    }
  } catch (error) {
    return { ok: false, message: 'Clipboard access was blocked. Paste manually with Ctrl+V.' };
  }
  return { ok: false, message: 'Clipboard access is not available here. Paste manually with Ctrl+V.' };
}

export async function shareText(title, text) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return { status: 'shared' };
    } catch (error) {
      if (error && error.name === 'AbortError') return { status: 'cancelled' };
      const copied = await copyText(text);
      return { status: copied ? 'copied' : 'failed' };
    }
  }
  const copied = await copyText(text);
  return { status: copied ? 'copied' : 'failed' };
}
