import { normalizeToken } from './emoji.js';

export const POOL_SIZE = 64;

const THEME_SOURCES = [
  {
    name: 'Crimson Faces',
    icon: '😀',
    emojis:
      '😀 😃 😄 😅 😆 😉 😊 😋 😎 🤩 🥰 😍 😘 😗 😙 😚 🤪 🤭 🤫 🤐 🤔 😶 😐 😑 😬 🙄 😏 😴 🤤 😪 😵 🤯 😤 😠 😡 🤬 🥳 🥸 😇 🥲 😢 😭 😱 😨 😰 😥 😦 🤧 😷 🤒 🤕 🤑 🤠 👻 💀 🤖 👾 😈 👿 💩 🤡 👺 🥶 🥵 🥺 😳 🤗 🤢 🤮 😛 😜 😖 😞 😣 😫 🙁 😌 😔 🥴 🥱 🫠 🫢 🫣 🫡 🫤 🫥 🫦 🙂 🙃 🤠 🥸',
  },
  {
    name: 'Wild Nature',
    icon: '🐾',
    emojis:
      '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🐤 🐣 🐥 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🐌 🐞 🐢 🐍 🐙 🦑 🦀 🐡 🐠 🐬 🐳 🦈 🐊 🐆 🐅 🐃 🐄 🐏 🐑 🐐 🦒 🐘 🦏 🦛 🐇 🐈 🐕 🐩 🐾 🐓 🦃 🕊 🦋 🦗 🕷 🦂 🦔 🦦 🦥 🦫 🐿 🦜 🦩 🦨 🦡 🦘 🦙 🐚 🪱 🪲 🪳 🪰 🪵 🦞 🦐 🐌',
  },
  {
    name: 'Food Lab',
    icon: '🍔',
    emojis:
      '🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🍈 🥝 🍅 🥥 🥑 🥦 🥬 🥒 🌶 🌽 🥕 🧄 🧅 🥔 🍄 🥜 🌰 🍞 🥐 🥖 🥨 🥯 🧀 🥚 🍳 🥞 🧇 🥓 🍔 🍟 🌭 🍿 🧈 🥪 🌮 🌯 🥙 🍕 🫓 🍜 🍝 🍲 🍛 🍣 🍱 🍤 🍚 🍘 🍥 🥮 🥟 🥠 🥡 🦪 🍦 🍨 🧁 🥧 🍰 🎂 🍫 🍬 🍭 🍮 🍯 🍪 🍩 🍡 🥛 🧂 🫙 🥗 🍢 🥪',
  },
  {
    name: 'Game On',
    icon: '🏆',
    emojis:
      '⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🎯 🎳 🪀 🪁 🎣 🏸 🏓 🥎 🏏 🏑 🏒 🥍 🥅 🤿 🎽 🤸 🤼 🤺 🏇 ⛸ 🛷 🛹 🛼 🚴 🚵 🏌 🏄 🏊 🤽 🤾 🏹 🥊 🥋 🏋 🧘 🧗 🤹 🏅 🥇 🥈 🥉 🎖 🏆 🎗 🕹 🎮 🎲 🃏 🎴 🎿 🛝 🥌 🩰 🪩 🎪 🎠 🎚 🪁',
  },
  {
    name: 'Voyage',
    icon: '🚀',
    emojis:
      '🚗 🚕 🚙 🚌 🚎 🏎 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🦯 🦽 🦼 🛴 🛵 🏍 🛺 🚨 🚥 🚦 🛑 🚧 ⚓ ⛵ 🛥 🚤 🛳 ⛴ ✈ 🛩 🛫 🛬 🚀 🛸 🚁 🚂 🚋 🚊 🚝 🚞 🚃 🚟 🚠 🚡 🗺 🗿 🗽 🏛 🕌 🕍 ⛪ 🕰 🗼 🌉 🏔 🌋 🏕 ⛺ 🏝 🏜 🛤 🏖 🌅 🌄 🌆 🌃 🛖 🏘 🛞',
  },
  {
    name: 'Tech Lab',
    icon: '💡',
    emojis:
      '💡 🔌 🔋 💻 🖥 🖨 ⌨ 🖱 💽 💾 💿 📀 📱 📲 📞 ☎ 📟 📠 🔦 🔔 🕭 📢 📣 🎧 🎤 📷 📸 📹 📺 📻 ⏱ ⏰ ⏲ ⌚ ⌛ 💳 💸 💰 🧳 💼 🎒 👜 🪑 🛏 🚪 🛁 🪥 🧼 🧴 🧻 🪣 🧹 🪒 🧽 🧯 🪤 🪄 🔑 🗝 🔒 🔓 🛡 ⚙ 🔧 🔨 🪛 ⚒ 🛠 🧰 🧭 📏 📐 ✏ ✒ 📝 📌 📎 🔗 ⛓ 🗑 🗃 🗄 📁 📂 📑 📊 📈 📉 📋 📆',
  },
  {
    name: 'Heart Grid',
    icon: '❤️',
    emojis:
      '❤ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣ 💕 💞 💓 💗 💖 💘 💝 💟 ❎ ❌ ⭕ ❗ ❓ ⚠ 🚫 💢 ♨ 🚭 🚱 🚷 🚳 🛑 ✅ ☑ 🔰 ⛔ ❕ ❔ 💯 🔟 🔢 🔣 🔞 🆔 🆕 🆒 🆓 ℹ 🆗 ⚕ ☢ ☣ ⚜ ⚛ ☪ ☯ ♿ ⚖ ➕ ➖ ➗ ✖ ✔ ✍ ✌ ♻ ♾ ➰ ➿ 🕉 🕎 🔠 🔡 🔤 🅰 🅱 🆎 🆑 🆖 🆘 🆙',
  },
  {
    name: 'Party Mode',
    icon: '🎉',
    emojis:
      '🎉 🎊 🎈 🎁 🎂 🎆 🎇 🎪 🎭 🎨 🎬 🎞 🎸 🎹 🎺 🎻 🎷 🥁 🎤 🎧 📯 🏆 🥇 🥈 🥉 🎖 🏅 🎗 🎫 🎟 🎡 🎠 🎢 🕹 🎮 🎲 🎯 🃏 🎴 🎿 💌 💐 🌹 🥀 🌺 🌻 🌷 🪩 🪅 🎏 🏮 🎍 🎑 🎐 🧧 🎎 🕎 🕯 🥳 🤹 🎃 🥮 🪗 🎛 🎚 🩰',
  },
];

function buildPool(source) {
  const seen = new Set();
  const list = [];
  for (const raw of source.emojis.split(/\s+/)) {
    if (!raw) continue;
    const symbol = normalizeToken(raw);
    if (!symbol || seen.has(symbol)) continue;
    seen.add(symbol);
    list.push(symbol);
    if (list.length === POOL_SIZE) break;
  }
  if (list.length !== POOL_SIZE) {
    throw new Error(`Emoji theme "${source.name}" only has ${list.length} unique symbols.`);
  }
  return list;
}

export const THEME_NAMES = THEME_SOURCES.map((source) => source.name);
export const THEME_ICONS = THEME_SOURCES.map((source) => source.icon);
export const THEME_COUNT = THEME_SOURCES.length;
export const POOLS = THEME_SOURCES.map(buildPool);

export const POOL_MAPS = POOLS.map((pool) => {
  const map = new Map();
  for (let i = 0; i < pool.length; i += 1) map.set(pool[i], i);
  return map;
});
