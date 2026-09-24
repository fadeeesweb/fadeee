import { describe, expect, it } from 'vitest';
import { encodeMessage, decodeMessage, getSpacer, MARKER, MAX_TEXT_LENGTH } from './codec.js';
import { codeSymbols } from './emoji.js';
import { POOLS, THEME_COUNT } from './pools.js';

async function roundTrip(text, options = {}) {
  const encoded = await encodeMessage(text, options);
  const decoded = await decodeMessage(encoded.code);
  return { encoded, decoded };
}

describe('auto emoji format', () => {
  it('encodes and decodes Hello World', async () => {
    const { encoded, decoded } = await roundTrip('Hello World');
    expect(encoded.format).toBe('auto');
    expect(encoded.code.startsWith(MARKER)).toBe(true);
    expect(decoded.ok).toBe(true);
    expect(decoded.text).toBe('Hello World');
    expect(decoded.format).toBe('auto');
  });

  it('produces a code made only of marker + pool emoji', async () => {
    const { encoded } = await roundTrip('Hello World');
    const symbols = codeSymbols(encoded.code);
    expect(symbols[0]).toBe(MARKER);
    for (const symbol of symbols.slice(1)) expect(POOLS[encoded.theme]).toContain(symbol);
    expect(encoded.code).not.toMatch(/\s/);
  });

  it('produces a unique code for the same input every time', async () => {
    const a = await encodeMessage('Same input', { mode: 'auto', theme: 3 });
    const b = await encodeMessage('Same input', { mode: 'auto', theme: 3 });
    expect(a.code).not.toBe(b.code);
    const first = await decodeMessage(a.code);
    const second = await decodeMessage(b.code);
    expect(first.ok).toBe(true);
    expect(first.text).toBe('Same input');
    expect(second.ok).toBe(true);
    expect(second.text).toBe('Same input');
  });

  it('supports every theme', async () => {
    for (let theme = 0; theme < THEME_COUNT; theme += 1) {
      const { encoded, decoded } = await roundTrip(`Theme ${theme} test`, { theme });
      expect(encoded.theme).toBe(theme);
      expect(decoded.ok).toBe(true);
      expect(decoded.text).toBe(`Theme ${theme} test`);
      expect(decoded.theme).toBe(theme);
    }
  });

  it('round trips uppercase, lowercase, numbers and punctuation', async () => {
    const samples = [
      'HELLO WORLD',
      'hello world',
      '1234567890',
      "What's up? #1 @home & more! (50%) [ok] {yes} <tag>",
      '~`^|\\/_-+=.,:;"\'',
    ];
    for (const sample of samples) {
      const { decoded } = await roundTrip(sample);
      expect(decoded.ok).toBe(true);
      expect(decoded.text).toBe(sample);
    }
  });

  it('round trips emoji inside the original message', async () => {
    const sample = 'I love 🔴 and 🖤 plus 👨‍👩‍👧 family and 🇯🇵 flag';
    const { decoded } = await roundTrip(sample);
    expect(decoded.text).toBe(sample);
  });

  it('round trips multiline messages', async () => {
    const sample = 'Line one\nLine two\r\nLine three\tTabbed';
    const { decoded } = await roundTrip(sample);
    expect(decoded.text).toBe(sample);
  });

  it('round trips Urdu and Roman Urdu', async () => {
    const samples = ['السلام علیکم! کیا حال ہے؟', 'Assalam o alaikum, kya haal hai?', 'پاکستان زندہ باد 🇵🇰'];
    for (const sample of samples) {
      const { decoded } = await roundTrip(sample);
      expect(decoded.text).toBe(sample);
    }
  });

  it('round trips unicode characters', async () => {
    const samples = ['café naïve résumé', '日本語のテキスト', 'Привет мир', 'Ελληνικά', 'مرحبا', '漢字與繁體中文'];
    for (const sample of samples) {
      const { decoded } = await roundTrip(sample);
      expect(decoded.text).toBe(sample);
    }
  });

  it('preserves spaces and long strings', async () => {
    for (const sample of [' ', '  leading and trailing  ', '\n', 'a'.repeat(500)]) {
      const { decoded } = await roundTrip(sample);
      expect(decoded.text).toBe(sample);
    }
  });
});

describe('custom emoji format', () => {
  it('round trips with two custom emojis', async () => {
    const options = { mode: 'custom', emoji1: '🔴', emoji2: '🖤' };
    const { encoded, decoded } = await roundTrip('Secret meeting at 9', options);
    expect(encoded.format).toBe('custom');
    expect(encoded.theme).toBe(2);
    const body = codeSymbols(encoded.code).slice(1);
    expect(new Set(body).size).toBe(2);
    expect(decoded.ok).toBe(true);
    expect(decoded.text).toBe('Secret meeting at 9');
    expect(decoded.format).toBe('custom');
  });

  it('round trips with a single custom emoji using a spacer', async () => {
    const options = { mode: 'custom', emoji1: '🔴' };
    const { encoded, decoded } = await roundTrip('Only one emoji chosen', options);
    expect(encoded.theme).toBe(1);
    expect(getSpacer('🔴')).toBe('⬛');
    const body = new Set(codeSymbols(encoded.code).slice(1));
    expect(body.has('🔴')).toBe(true);
    expect(body.has('⬛')).toBe(true);
    expect(decoded.ok).toBe(true);
    expect(decoded.text).toBe('Only one emoji chosen');
  });

  it('never collides with the chosen spacer', async () => {
    const { decoded } = await roundTrip('spacer collision', { mode: 'custom', emoji1: '⬛' });
    expect(decoded.ok).toBe(true);
    expect(decoded.text).toBe('spacer collision');
  });

  it('treats two identical custom emojis as one emoji mode', async () => {
    const { encoded, decoded } = await roundTrip('same twice', { mode: 'custom', emoji1: '🚀', emoji2: '🚀' });
    expect(encoded.theme).toBe(1);
    expect(decoded.text).toBe('same twice');
  });

  it('accepts complex multi codepoint custom emoji', async () => {
    for (const emoji of ['👨‍👩‍👧', '🇯🇵', '1️⃣', '👍🏽', '❤️']) {
      const { decoded } = await roundTrip(`with ${emoji}`, { mode: 'custom', emoji1: emoji, emoji2: '🖤' });
      expect(decoded.ok).toBe(true);
      expect(decoded.text).toBe(`with ${emoji}`);
    }
  });

  it('rejects invalid custom emoji choices', async () => {
    await expect(encodeMessage('hi', { mode: 'custom', emoji1: 'not an emoji' })).rejects.toMatchObject({
      code: 'CUSTOM_EMOJI',
    });
    await expect(encodeMessage('hi', { mode: 'custom', emoji1: '🔴🖤' })).rejects.toMatchObject({
      code: 'CUSTOM_EMOJI',
    });
    await expect(
      encodeMessage('hi', { mode: 'custom', emoji1: '🔴', emoji2: 'text' })
    ).rejects.toMatchObject({ code: 'CUSTOM_EMOJI' });
  });

  it('rejects empty messages and oversized messages', async () => {
    await expect(encodeMessage('')).rejects.toMatchObject({ code: 'EMPTY_TEXT' });
    await expect(encodeMessage('a'.repeat(MAX_TEXT_LENGTH + 1))).rejects.toMatchObject({ code: 'TOO_LONG' });
  });
});
