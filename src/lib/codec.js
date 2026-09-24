import {
  base64UrlToBytes,
  bitsToBytes,
  bytesToBase64Url,
  bytesToBits,
  bytesToStr,
  sixBitsToBytes,
  bytesToSixBits,
  strToBytes,
} from './bytes.js';
import { sha256 } from './hash.js';
import { codeSymbols, looksLikeEmoji, normalizeEmojiChoice } from './emoji.js';
import { POOL_MAPS, POOLS, THEME_COUNT } from './pools.js';

export const VERSION = 'EC1';
export const MARKER = '\u{1F510}';
export const MAX_TEXT_LENGTH = 10000;
export const MAX_CODE_LENGTH = 400000;
export const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000;
export const MAX_EXPIRY_MS = DEFAULT_EXPIRY_MS;

const SPACERS = ['⬛', '⬜', '◾', '◽'];
const NEVER = '\u0000';

export const ERROR_MESSAGES = {
  EMPTY_TEXT: 'Please enter a message.',
  TOO_LONG: `Message is too long. Maximum ${MAX_TEXT_LENGTH.toLocaleString('en-US')} characters.`,
  CUSTOM_EMOJI: 'Please select one or two valid emojis.',
  EXPIRATION: 'Invalid expiration time.',
  EMPTY_INPUT: 'Please paste an Emoji Code to decode.',
  NOT_CREATED: 'This code was not created by Emoji Code.',
  INVALID: 'Invalid Emoji Code.',
  DAMAGED: 'This message appears to be damaged. Make sure the whole code was copied.',
  TOO_LONG_CODE: 'This Emoji Code is too long to decode.',
  UNSUPPORTED: 'This code was created by a newer version of Emoji Code.',
  EXPIRED: 'This message has expired. Codes are valid for 24 hours.',
  ERROR: 'Unable to decode this message. Make sure the emoji code was created by Emoji Code.',
};

export class CodecError extends Error {
  constructor(code) {
    super(ERROR_MESSAGES[code] || ERROR_MESSAGES.ERROR);
    this.name = 'CodecError';
    this.code = code;
  }
}

function fail(code) {
  return { ok: false, code, message: ERROR_MESSAGES[code] || ERROR_MESSAGES.ERROR };
}

export function validateExpiration(hours, minutes) {
  let h = Number(hours);
  let m = Number(minutes);
  if (!Number.isFinite(h)) h = 0;
  if (!Number.isFinite(m)) m = 0;
  if (h < 0) return { ok: false, message: 'Hours cannot be negative.' };
  if (m < 0) return { ok: false, message: 'Minutes must be between 0 and 59.' };
  h = Math.floor(h);
  m = Math.floor(m);
  if (m > 59) return { ok: false, message: 'Minutes must be between 0 and 59.' };
  if (h * 3600000 + m * 60000 > MAX_EXPIRY_MS) {
    return { ok: false, message: 'Expiration cannot be longer than 24 hours.' };
  }
  if (h === 0 && m === 0) {
    return { ok: false, message: 'Set at least 1 hour or 1 minute of expiration.' };
  }
  return { ok: true, hours: h, minutes: m };
}

export function getSpacer(emoji) {
  const primary = normalizeEmojiChoice(emoji);
  return SPACERS.find((spacer) => spacer !== primary) || SPACERS[1];
}

function buildCustomAlphabet(emoji1, emoji2) {
  const primary = normalizeEmojiChoice(emoji1);
  if (!primary) throw new CodecError('CUSTOM_EMOJI');
  let secondary = null;
  if (emoji2 !== undefined && emoji2 !== null && String(emoji2).trim() !== '') {
    secondary = normalizeEmojiChoice(emoji2);
    if (!secondary) throw new CodecError('CUSTOM_EMOJI');
    if (secondary === primary) secondary = null;
  }
  if (secondary) return { alphabet: [primary, secondary], mode: 2 };
  return { alphabet: [primary, getSpacer(primary)], mode: 1 };
}

function randomNonce() {
  const bytes = new Uint8Array(8);
  const webCrypto = typeof globalThis.crypto === 'object' ? globalThis.crypto : null;
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytesToBase64Url(bytes);
}

export async function encodeMessage(text, options = {}) {
  if (typeof text !== 'string' || text.length === 0) throw new CodecError('EMPTY_TEXT');
  if (text.length > MAX_TEXT_LENGTH) throw new CodecError('TOO_LONG');

  const mode = options.mode === 'custom' ? 'custom' : 'auto';
  let theme = 0;
  let alphabet = null;
  let customMode = 0;

  if (mode === 'auto') {
    const requested = Number(options.theme);
    theme = Number.isInteger(requested) && requested >= 0 && requested < THEME_COUNT ? requested : 0;
  } else {
    const built = buildCustomAlphabet(options.emoji1, options.emoji2);
    alphabet = built.alphabet;
    customMode = built.mode;
    theme = customMode;
  }

  const now = Number.isFinite(options.now) ? options.now : Date.now();
  let expiry;
  if (options.expires) {
    const valid = validateExpiration(options.hours, options.minutes);
    if (!valid.ok) throw new CodecError('EXPIRATION');
    expiry = Math.floor((now + valid.hours * 3600000 + valid.minutes * 60000) / 1000) * 1000;
  } else {
    expiry = Math.floor((now + DEFAULT_EXPIRY_MS) / 1000) * 1000;
  }

  const nonce = randomNonce();
  const payload = bytesToBase64Url(strToBytes(text));
  const core = `${VERSION}|${mode === 'auto' ? 'A' : 'C'}|${theme}|${expiry}|${nonce}|${payload}`;
  const digest = await sha256(strToBytes(core));
  const checksum = bytesToBase64Url(digest.slice(0, 8));
  const packet = `${core}|${checksum}`;
  const bytes = strToBytes(packet);

  let symbols;
  if (mode === 'auto') {
    const pool = POOLS[theme];
    symbols = bytesToSixBits(bytes).map((index) => pool[index]);
  } else {
    symbols = bytesToBits(bytes).map((bit) => alphabet[bit]);
  }

  return {
    ok: true,
    code: MARKER + symbols.join(''),
    format: mode,
    theme,
    expiry,
    symbolCount: symbols.length,
    charCount: text.length,
  };
}

function parsePacket(bytes) {
  const text = bytesToStr(bytes);
  const parts = text.split('|');
  const legacy = parts.length === 6;
  const withNonce = parts.length === 7;
  if (!legacy && !withNonce) return null;
  const [version, format, theme, expiry] = parts;
  const nonce = withNonce ? parts[4] : null;
  const payload = withNonce ? parts[5] : parts[4];
  const checksum = parts[parts.length - 1];
  if (!/^EC\d{1,2}$/.test(version)) return null;
  if (version !== VERSION) return { unsupported: true };
  if (format !== 'A' && format !== 'C') return null;
  if (!/^\d{1,6}$/.test(theme)) return null;
  if (!/^\d{1,16}$/.test(expiry)) return null;
  if (withNonce && !/^[A-Za-z0-9\-_]{8,24}$/.test(nonce)) return null;
  if (!/^[A-Za-z0-9\-_]*$/.test(payload)) return null;
  if (!/^[A-Za-z0-9\-_]{8,24}$/.test(checksum)) return null;
  return {
    core: parts.slice(0, -1).join('|'),
    fields: {
      format,
      theme: Number(theme),
      expiry: Number(expiry),
      payload,
      checksum,
      nonce,
    },
  };
}

function autoCandidate(body, theme) {
  const map = POOL_MAPS[theme];
  const indices = new Array(body.length);
  for (let i = 0; i < body.length; i += 1) {
    const index = map.get(body[i]);
    if (index === undefined) return null;
    indices[i] = index;
  }
  return { bytes: sixBitsToBytes(indices), format: 'A', theme };
}

function customCandidates(body) {
  const distinct = [];
  const seen = new Set();
  for (const symbol of body) {
    if (!seen.has(symbol)) {
      seen.add(symbol);
      distinct.push(symbol);
    }
  }
  if (distinct.length < 1 || distinct.length > 2) return [];
  const pairs =
    distinct.length === 2
      ? [
          [distinct[0], distinct[1]],
          [distinct[1], distinct[0]],
        ]
      : [
          [distinct[0], NEVER],
          [NEVER, distinct[0]],
        ];
  const out = [];
  for (const [bit0, bit1] of pairs) {
    const bits = new Array(body.length);
    let ok = true;
    for (let i = 0; i < body.length; i += 1) {
      const symbol = body[i];
      if (symbol === bit0) bits[i] = 0;
      else if (symbol === bit1) bits[i] = 1;
      else {
        ok = false;
        break;
      }
    }
    if (ok) out.push({ bytes: bitsToBytes(bits), format: 'C' });
  }
  return out;
}

export async function decodeMessage(input, options = {}) {
  try {
    if (typeof input !== 'string' || input.trim().length === 0) return fail('EMPTY_INPUT');
    if (input.length > MAX_CODE_LENGTH) return fail('TOO_LONG_CODE');

    const tokens = codeSymbols(input);
    if (tokens.length === 0) return fail('EMPTY_INPUT');
    if (tokens[0] !== MARKER) return fail('NOT_CREATED');

    const body = tokens.slice(1);
    if (body.length === 0) return fail('INVALID');

    const candidates = [];
    for (let theme = 0; theme < THEME_COUNT; theme += 1) {
      const candidate = autoCandidate(body, theme);
      if (candidate) candidates.push(candidate);
    }
    candidates.push(...customCandidates(body));

    let sawChecksumFailure = false;
    let sawStructure = false;
    let sawUnsupported = false;

    for (const candidate of candidates) {
      const parsed = parsePacket(candidate.bytes);
      if (!parsed) continue;
      if (parsed.unsupported) {
        sawUnsupported = true;
        continue;
      }
      sawStructure = true;
      const fields = parsed.fields;
      if (fields.format !== candidate.format) continue;
      if (candidate.format === 'A' && fields.theme !== candidate.theme) continue;
      if (candidate.format === 'C' && fields.theme !== 1 && fields.theme !== 2) continue;

      const digest = await sha256(strToBytes(parsed.core));
      const checksum = bytesToBase64Url(digest.slice(0, 8));
      if (checksum !== fields.checksum) {
        sawChecksumFailure = true;
        continue;
      }

      let text;
      try {
        text = bytesToStr(base64UrlToBytes(fields.payload));
      } catch (error) {
        sawChecksumFailure = true;
        continue;
      }

      const expiry = fields.expiry;
      const now = Number.isFinite(options.now) ? options.now : Date.now();
      const expired = expiry > 0 && now > expiry;

      return {
        ok: true,
        expired,
        expiry,
        text: expired ? null : text,
        format: fields.format === 'A' ? 'auto' : 'custom',
        theme: fields.theme,
      };
    }

    if (sawUnsupported) return fail('UNSUPPORTED');
    if (sawChecksumFailure || sawStructure) return fail('DAMAGED');
    if (body.some((symbol) => !looksLikeEmoji(symbol))) return fail('INVALID');
    return fail('DAMAGED');
  } catch (error) {
    return fail('ERROR');
  }
}
