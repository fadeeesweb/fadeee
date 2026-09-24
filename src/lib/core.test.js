import { describe, expect, it } from 'vitest';
import { sha256Sync } from './hash.js';
import {
  base64UrlToBytes,
  bytesToBase64Url,
  bytesToSixBits,
  sixBitsToBytes,
  strToBytes,
  bytesToStr,
  bytesToBits,
  bitsToBytes,
} from './bytes.js';
import { codeSymbols, normalizeEmojiChoice, tokenize } from './emoji.js';
import { POOLS, THEME_COUNT, THEME_NAMES } from './pools.js';
import { MARKER } from './codec.js';

const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

describe('SHA-256', () => {
  it('matches known test vectors', () => {
    expect(toHex(sha256Sync(new Uint8Array(0)))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
    expect(toHex(sha256Sync(strToBytes('abc')))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
    expect(toHex(sha256Sync(strToBytes('The quick brown fox jumps over the lazy dog')))).toBe(
      'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592'
    );
  });

  it('handles long multi block input', () => {
    expect(toHex(sha256Sync(strToBytes('a'.repeat(1000)))).length).toBe(64);
  });
});

describe('byte helpers', () => {
  it('round trips base64url', () => {
    for (const text of ['', 'a', 'ab', 'abc', 'Hello World', 'میرا پیغام', '🔐❤️']) {
      const bytes = strToBytes(text);
      expect(bytesToStr(base64UrlToBytes(bytesToBase64Url(bytes)))).toBe(text);
    }
  });

  it('rejects invalid base64url', () => {
    expect(() => base64UrlToBytes('A')).toThrow();
    expect(() => base64UrlToBytes('ab$cd')).toThrow();
  });

  it('round trips 6 bit chunking for every byte length', () => {
    for (let length = 0; length < 40; length += 1) {
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i += 1) bytes[i] = (i * 37 + 11) & 255;
      expect(Array.from(sixBitsToBytes(bytesToSixBits(bytes)))).toEqual(Array.from(bytes));
    }
  });

  it('round trips bit arrays', () => {
    for (const text of ['', 'a', 'hello world', '🔐']) {
      const bytes = strToBytes(text);
      expect(Array.from(bitsToBytes(bytesToBits(bytes)))).toEqual(Array.from(bytes));
    }
  });
});

describe('emoji tokenizer', () => {
  it('keeps simple emoji as one token', () => {
    expect(tokenize('🔴🖤')).toEqual(['🔴', '🖤']);
  });

  it('keeps flags, keycaps and ZWJ sequences together', () => {
    expect(tokenize('🇯🇵🇰🇷')).toEqual(['🇯🇵', '🇰🇷']);
    expect(tokenize('1️⃣')).toEqual(['1️⃣']);
    expect(tokenize('👨‍👩‍👧‍👦')).toEqual(['👨‍👩‍👧‍👦']);
    expect(tokenize('👍🏽')).toEqual(['👍🏽']);
  });

  it('ignores invisible formatting characters', () => {
    expect(codeSymbols('\u200B🔐\uFEFF❤️\u200D')).toEqual(['🔐', '❤']);
  });

  it('normalizes variation selectors and skin tones', () => {
    expect(normalizeEmojiChoice('❤️')).toBe('❤');
    expect(normalizeEmojiChoice('👍🏻')).toBe('👍');
    expect(normalizeEmojiChoice('red')).toBe(null);
    expect(normalizeEmojiChoice('🔴🖤')).toBe(null);
  });
});

describe('emoji pools', () => {
  it('has 8 themes of 64 unique symbols', () => {
    expect(THEME_COUNT).toBe(8);
    expect(THEME_NAMES).toHaveLength(8);
    for (const pool of POOLS) {
      expect(pool).toHaveLength(64);
      expect(new Set(pool).size).toBe(64);
    }
  });

  it('never uses the marker symbol inside a pool', () => {
    for (const pool of POOLS) expect(pool.includes(MARKER)).toBe(false);
  });
});
