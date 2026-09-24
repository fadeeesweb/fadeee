# Emoji Code

Turn ordinary messages into extraordinary emoji codes — and decode them back, instantly and locally.

Emoji Code is a fully static React + Vite app. There is **no backend**: encoding, decoding, QR generation
and expiration timers all run inside your browser.

## Features

- **Auto Emoji** — pick one of 8 curated 64-emoji themes (Crimson Faces, Wild Nature, Food Lab, Game On,
  Voyage, Tech Lab, Heart Grid, Party Mode) and your message is scrambled into that theme's symbols.
- **Custom Emoji** — *coming soon*: bring your own 1 or 2 emoji alphabet. The option is visible but locked
  for now.
- **Reversible decode** — the format, theme and payload travel inside the code, so one button detects and
  decodes both formats.
- **Integrity check** — every code carries a SHA-256 checksum; damaged codes report a clear error instead
  of printing garbage.
- **Unique every time** — a random nonce is baked into each packet, so the same message always produces a
  different code (never the same emoji string twice).
- **24-hour auto-expiry** — every code expires exactly 24 hours after it is created. A custom timer (max
  24 hours) is stored in the code itself, with live countdowns and an unmistakable
  "THIS MESSAGE HAS EXPIRED" state. Codes are plain emoji — anyone can decode them, no account needed.
- **Extras** — QR code that carries your **original message** (scan with any phone camera and read it
  directly, no app needed), native share sheet with clipboard fallback, toasts, keyboard
  shortcuts. Nothing is ever stored.
- **Button-first layout** — the encoder and decoder start closed. "Start Encoding" / "Decode Message"
  (hero, navbar, footer) or the section's own button opens one and scrolls to it.
- **Premium design** — red-black glassmorphism, animated particle background, floating hero title,
  fully responsive, `prefers-reduced-motion` supported.

## Quick start

```bash
npm install
npm run dev      # local dev server
npm test         # 50 vitest tests (codec + UI smoke)
npm run build    # production build into dist/
npm run preview  # serve the production build
```

Requires Node 18+.

## Deploying

The Vite config sets `base: './'`, so the build works from any path (project pages, subfolders, `file://`).

**Netlify / Vercel / any static host** — publish the `dist` directory:

- Build command: `npm run build`
- Publish directory: `dist`

**GitHub Pages**

1. `npm run build`
2. Push the repository to GitHub.
3. Settings → Pages → Deploy from a branch → `main` → `/docs` **or** use an action that uploads `dist`:

```yaml
# .github/workflows/pages.yml (simplest version)
name: Pages
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - uses: actions/deploy-pages@v4
```

## How the encoding works

Every code is a marker followed by a symbol stream:

```
🔐 + symbols( base64url( packet ) )
packet = EC1 | <A or C> | <theme> | <expiry epoch ms> | <nonce> | <payload base64url> | <checksum>
```

- `A` = Auto Emoji, `C` = Custom Emoji. The theme field is the pool index (auto) or emoji count (custom).
- **Auto**: each 6-bit chunk of the packet maps to one of the pool's 64 unique emoji.
- **Custom**: the packet is a bit stream rendered with your two emoji (or emoji + spacer), so the code
  uses exactly the emojis you picked.
- The **nonce** is 8 random bytes; it makes every encode unique and is covered by the checksum. Legacy
  packets without a nonce (6 fields) still decode fine.
- The checksum is the first 8 bytes of SHA-256 over the packet header. On decode, tokens are stripped of
  junk, candidates are tested for both formats, the packet is parsed, and the checksum is verified.
- Expiration is an absolute timestamp inside the packet, so the countdown works on any device. If no
  custom timer is set, the timestamp defaults to creation time + 24 hours; decoding after that returns an
  EXPIRED state without revealing the text.

Encoding is **not** encryption: it scrambles and restores messages, and verifies integrity, but it does not
hide meaning from someone who understands the format. It also does not replace end-to-end encrypted
messengers.

## Privacy

- Messages are processed locally; nothing is sent anywhere.
- Nothing is persisted: no history, no localStorage, no cookies, no accounts, no analytics, no trackers.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl` / `Cmd` + `Enter` | Encode the current message |
| `Ctrl` / `Cmd` + `Shift` + `Enter` | Decode the pasted code |
| `Esc` | Close the emoji picker / mobile menu |

## Project structure

```
src/
  lib/         codec, emoji tokeniser, SHA-256, byte helpers, themes, clipboard, format
  hooks/       useNow (ticking clock)
  components/  Navbar, Hero, EncodeSection, DecodeSection, EmojiPicker,
               HowItWorks, PrivacySection, Footer, Toasts, Particles, ErrorBoundary
  styles/      base, components, panels, overlays, layout, sections, animations
```

## Tests

`npm test` runs:

- `core.test.js` / `codec.test.js` / `expiry.test.js` — round trips, both formats, all 8 themes,
  checksum failures, hostile input, per-encode unique codes, 24-hour default expiry, custom timer
  validation (max 24h), legacy packet compatibility.
- `App.smoke.test.jsx` — renders the full app in jsdom, checks the History section is gone, the Custom
  option is locked behind "Coming Soon", and exercises encode → decode plus damaged-code errors.
