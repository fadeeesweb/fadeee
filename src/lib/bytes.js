const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

export function strToBytes(str) {
  return encoder.encode(str);
}

export function bytesToStr(bytes) {
  return decoder.decode(bytes);
}

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const B64_MAP = (() => {
  const map = new Int16Array(128).fill(-1);
  for (let i = 0; i < 64; i += 1) map[B64URL.charCodeAt(i)] = i;
  return map;
})();

export function bytesToBase64Url(bytes) {
  let out = '';
  let i = 0;
  const len = bytes.length;
  for (; i + 2 < len; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out +=
      B64URL[(n >>> 18) & 63] +
      B64URL[(n >>> 12) & 63] +
      B64URL[(n >>> 6) & 63] +
      B64URL[n & 63];
  }
  const rest = len - i;
  if (rest === 1) {
    const n = bytes[i] << 16;
    out += B64URL[(n >>> 18) & 63] + B64URL[(n >>> 12) & 63];
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += B64URL[(n >>> 18) & 63] + B64URL[(n >>> 12) & 63] + B64URL[(n >>> 6) & 63];
  }
  return out;
}

export function base64UrlToBytes(str) {
  const len = str.length;
  if (len % 4 === 1) throw new Error('Invalid base64url input');
  const out = new Uint8Array(Math.floor((len * 6) / 8));
  let acc = 0;
  let bits = 0;
  let pos = 0;
  for (let i = 0; i < len; i += 1) {
    const code = str.charCodeAt(i);
    const value = code < 128 ? B64_MAP[code] : -1;
    if (value < 0) throw new Error('Invalid base64url character');
    acc = (acc << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[pos] = (acc >>> bits) & 255;
      pos += 1;
      acc &= bits > 0 ? (1 << bits) - 1 : 0;
    }
  }
  if (pos !== out.length) throw new Error('Invalid base64url length');
  return out;
}

export function bytesToSixBits(bytes) {
  const out = [];
  let acc = 0;
  let bits = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    acc = (acc << 8) | bytes[i];
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      out.push((acc >>> bits) & 63);
    }
    acc &= bits > 0 ? (1 << bits) - 1 : 0;
  }
  if (bits > 0) out.push((acc << (6 - bits)) & 63);
  return out;
}

export function sixBitsToBytes(indices) {
  const out = new Uint8Array(Math.floor((indices.length * 6) / 8));
  let acc = 0;
  let bits = 0;
  let pos = 0;
  for (let i = 0; i < indices.length; i += 1) {
    acc = (acc << 6) | (indices[i] & 63);
    bits += 6;
    while (bits >= 8) {
      bits -= 8;
      out[pos] = (acc >>> bits) & 255;
      pos += 1;
    }
    acc &= bits > 0 ? (1 << bits) - 1 : 0;
  }
  return out;
}

export function bytesToBits(bytes) {
  const out = new Array(bytes.length * 8);
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i];
    for (let j = 0; j < 8; j += 1) {
      out[i * 8 + j] = (byte >>> (7 - j)) & 1;
    }
  }
  return out;
}

export function bitsToBytes(bits) {
  const count = Math.floor(bits.length / 8);
  const out = new Uint8Array(count);
  for (let i = 0; i < count; i += 1) {
    let value = 0;
    for (let j = 0; j < 8; j += 1) {
      value = (value << 1) | (bits[i * 8 + j] ? 1 : 0);
    }
    out[i] = value;
  }
  return out;
}
