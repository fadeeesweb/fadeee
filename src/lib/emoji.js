const SKIN_TONES = /[\u{1F3FB}-\u{1F3FF}]/u;
const REGIONAL = /[\u{1F1E6}-\u{1F1FF}]/u;
const MODIFIERS = /[\uFE0E\uFE0F\u20E3]/;
const NORMALIZE_STRIP = /[\uFE0E\uFE0F\u{1F3FB}-\u{1F3FF}]/gu;
const JUNK = /[\u00AD\u200B\u200C\u200E\u200F\u2060\uFEFF]/g;
const PICTOGRAPHIC = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{20E3}]/u;

export function tokenize(str) {
  const chars = Array.from(str);
  const out = [];
  let i = 0;
  while (i < chars.length) {
    let token = chars[i];
    i += 1;
    if (REGIONAL.test(token)) {
      if (i < chars.length && REGIONAL.test(chars[i])) {
        token += chars[i];
        i += 1;
      }
      out.push(token);
      continue;
    }
    for (;;) {
      if (i >= chars.length) break;
      const next = chars[i];
      if (MODIFIERS.test(next) || SKIN_TONES.test(next)) {
        token += next;
        i += 1;
        continue;
      }
      if (next === '\u200D') {
        i += 1;
        if (i < chars.length) {
          token += '\u200D' + chars[i];
          i += 1;
          continue;
        }
        break;
      }
      break;
    }
    out.push(token);
  }
  return out;
}

export function normalizeToken(token) {
  return token.replace(NORMALIZE_STRIP, '');
}

export function cleanCodeInput(str) {
  return String(str ?? '').replace(JUNK, '');
}

export function codeSymbols(code) {
  const tokens = tokenize(cleanCodeInput(code));
  const out = [];
  for (const token of tokens) {
    const normalized = normalizeToken(token);
    if (normalized && normalized.trim() !== '') out.push(normalized);
  }
  return out;
}

export function looksLikeEmoji(token) {
  return PICTOGRAPHIC.test(token);
}

export function normalizeEmojiChoice(value) {
  const symbols = codeSymbols(String(value ?? ''));
  if (symbols.length !== 1) return null;
  return symbols[0];
}
