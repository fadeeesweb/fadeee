import { describe, expect, it } from 'vitest';
import { decodeMessage, encodeMessage, validateExpiration, MARKER } from './codec.js';
import { codeSymbols } from './emoji.js';
import { POOLS } from './pools.js';
import { sha256Sync } from './hash.js';
import { bytesToBase64Url, bytesToSixBits, strToBytes } from './bytes.js';

describe('expiration', () => {
  it('expires automatically after 24 hours by default', async () => {
    const now = 1700000000000;
    const encoded = await encodeMessage('no timer', { mode: 'auto', now });
    expect(encoded.expiry).toBe(now + 24 * 3600000);
    const before = await decodeMessage(encoded.code, { now: now + 24 * 3600000 - 1000 });
    expect(before.ok).toBe(true);
    expect(before.expired).toBe(false);
    expect(before.text).toBe('no timer');
    const after = await decodeMessage(encoded.code, { now: now + 24 * 3600000 + 1000 });
    expect(after.ok).toBe(true);
    expect(after.expired).toBe(true);
    expect(after.text).toBe(null);
  });

  it('supports a one minute expiration', async () => {
    const now = 1700000000000;
    const encoded = await encodeMessage('one minute', { expires: true, hours: 0, minutes: 1, now });
    const decoded = await decodeMessage(encoded.code, { now });
    expect(encoded.expiry).toBe(now + 60000);
    expect(decoded.ok).toBe(true);
    expect(decoded.expired).toBe(false);
    expect(decoded.expiry).toBe(now + 60000);
  });

  it('supports hour plus minute expiration', async () => {
    const now = 1700000000000;
    const encoded = await encodeMessage('two hours', { expires: true, hours: 2, minutes: 30, now });
    const decoded = await decodeMessage(encoded.code, { now: now + 1000 });
    expect(encoded.expiry).toBe(now + 2.5 * 3600000);
    expect(decoded.expired).toBe(false);
    expect(decoded.text).toBe('two hours');
  });

  it('reports expiration without revealing the message', async () => {
    const now = 1700000000000;
    const encoded = await encodeMessage('top secret', { expires: true, hours: 1, minutes: 0, now });
    const decoded = await decodeMessage(encoded.code, { now: now + 3600000 + 1000 });
    expect(decoded.ok).toBe(true);
    expect(decoded.expired).toBe(true);
    expect(decoded.text).toBe(null);
    expect(decoded.expiry).toBe(now + 3600000);
  });

  it('validates expiration input', () => {
    expect(validateExpiration(-1, 0)).toEqual({ ok: false, message: 'Hours cannot be negative.' });
    expect(validateExpiration(0, 60)).toEqual({ ok: false, message: 'Minutes must be between 0 and 59.' });
    expect(validateExpiration(0, -5)).toEqual({ ok: false, message: 'Minutes must be between 0 and 59.' });
    expect(validateExpiration(0, 0)).toMatchObject({ ok: false });
    expect(validateExpiration(2, 30)).toEqual({ ok: true, hours: 2, minutes: 30 });
    expect(validateExpiration('7', '5')).toEqual({ ok: true, hours: 7, minutes: 5 });
    expect(validateExpiration(1.9, 59.7)).toEqual({ ok: true, hours: 1, minutes: 59 });
    expect(validateExpiration(NaN, NaN)).toMatchObject({ ok: false });
    expect(validateExpiration(10000, 0)).toMatchObject({ ok: false });
  });

  it('rejects invalid expiration at encode time', async () => {
    await expect(encodeMessage('hi', { expires: true, hours: 0, minutes: 0 })).rejects.toMatchObject({
      code: 'EXPIRATION',
    });
    await expect(encodeMessage('hi', { expires: true, hours: -2, minutes: 0 })).rejects.toMatchObject({
      code: 'EXPIRATION',
    });
    await expect(encodeMessage('hi', { expires: true, hours: 0, minutes: 75 })).rejects.toMatchObject({
      code: 'EXPIRATION',
    });
    await expect(encodeMessage('hi', { expires: true, hours: 25, minutes: 0 })).rejects.toMatchObject({
      code: 'EXPIRATION',
    });
    await expect(encodeMessage('hi', { expires: true, hours: 24, minutes: 1 })).rejects.toMatchObject({
      code: 'EXPIRATION',
    });
  });
});

describe('decoder auto detection and errors', () => {
  it('detects both formats automatically', async () => {
    const auto = await encodeMessage('auto detect', { mode: 'auto', theme: 5 });
    const custom = await encodeMessage('auto detect', { mode: 'custom', emoji1: '👽', emoji2: '🛸' });
    const both = await decodeMessage(auto.code);
    const other = await decodeMessage(custom.code);
    expect(both.text).toBe('auto detect');
    expect(both.format).toBe('auto');
    expect(other.text).toBe('auto detect');
    expect(other.format).toBe('custom');
  });

  it('flags random emoji input', async () => {
    const result = await decodeMessage('😀🎉🔥🍕🚀❤️⚽🐶');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('NOT_CREATED');
    expect(result.message).toBe('This code was not created by Emoji Code.');
  });

  it('flags empty input', async () => {
    for (const input of ['', '   ', '\n\n', '\u200B\uFEFF']) {
      const result = await decodeMessage(input);
      expect(result.ok).toBe(false);
      expect(result.code).toBe('EMPTY_INPUT');
    }
  });

  it('flags damaged codes', async () => {
    const encoded = await encodeMessage('damage detection test', { mode: 'auto', theme: 2 });
    const symbols = codeSymbols(encoded.code);
    const pool = POOLS[2];
    const swapped = [...symbols];
    swapped[20] = pool[(pool.indexOf(symbols[20]) + 7) % 64];
    const damaged = await decodeMessage(MARKER + swapped.slice(1).join(''));
    expect(damaged.ok).toBe(false);
    expect(damaged.code).toBe('DAMAGED');

    const truncated = await decodeMessage(symbols.slice(0, Math.floor(symbols.length / 2)).join(''));
    expect(truncated.ok).toBe(false);
    expect(['DAMAGED', 'INVALID']).toContain(truncated.code);
  });

  it('flags custom codes with a swapped symbol as damaged', async () => {
    const encoded = await encodeMessage('custom damage', { mode: 'custom', emoji1: '🔴', emoji2: '🖤' });
    const symbols = codeSymbols(encoded.code);
    const last = symbols[symbols.length - 1];
    symbols[symbols.length - 1] = last === '🔴' ? '🖤' : '🔴';
    const result = await decodeMessage(symbols.join(''));
    expect(result.ok).toBe(false);
    expect(result.code).toBe('DAMAGED');
  });

  it('flags a code with junk after the marker', async () => {
    const result = await decodeMessage(`${MARKER}hello world`);
    expect(result.ok).toBe(false);
    expect(result.code).toBe('INVALID');
    expect(result.message).toBe('Invalid Emoji Code.');
  });

  it('flags a marker only code', async () => {
    const result = await decodeMessage(MARKER);
    expect(result.ok).toBe(false);
    expect(result.code).toBe('INVALID');
  });

  it('never throws on hostile input', async () => {
    const hostile = [
      MARKER + '❌'.repeat(50),
      MARKER + 'A|B|C|D|E|F',
      `${MARKER}${'🔴'.repeat(200)}${'x'.repeat(50)}`,
      `${MARKER} EC1|A|0|0|abc|d`,
      '🔐'.repeat(1000),
      `${MARKER}🇯🇵🇰🇷🇯🇵`,
      `  ${MARKER}  🔴  🔴  `,
    ];
    for (const input of hostile) {
      const result = await decodeMessage(input);
      expect(result.ok).toBe(false);
      expect(typeof result.message).toBe('string');
    }
  });

  it('ignores line breaks and spaces inside a pasted code', async () => {
    const encoded = await encodeMessage('wrapped message', { mode: 'auto', theme: 1 });
    const wrapped = Array.from(encoded.code).join('\n');
    const result = await decodeMessage(wrapped);
    expect(result.ok).toBe(true);
    expect(result.text).toBe('wrapped message');
  });

  it('still decodes legacy codes created without a nonce', async () => {
    const payload = bytesToBase64Url(strToBytes('legacy message'));
    const core = `EC1|A|0|0|${payload}`;
    const checksum = bytesToBase64Url(sha256Sync(strToBytes(core)).slice(0, 8));
    const packet = `${core}|${checksum}`;
    const symbols = bytesToSixBits(strToBytes(packet)).map((index) => POOLS[0][index]);
    const result = await decodeMessage(MARKER + symbols.join(''));
    expect(result.ok).toBe(true);
    expect(result.text).toBe('legacy message');
    expect(result.expired).toBe(false);
  });
});
