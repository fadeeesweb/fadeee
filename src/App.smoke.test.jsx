// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no canvas implementation; Particles falls back gracefully when getContext is null.
window.HTMLCanvasElement.prototype.getContext = () => null;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function renderApp() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
  return { container, root };
}

function setReactValue(element, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

function bodyText() {
  return document.body.textContent || '';
}

async function openSection(name) {
  const gate = document.getElementById(name);
  expect(gate, `#${name} section`).toBeTruthy();
  const button = gate.querySelector('button');
  expect(button, `#${name} gate button`).toBeTruthy();
  await act(async () => {
    button.click();
    await wait(200);
  });
}

describe('App shell', () => {
  let entry;

  beforeEach(() => {
    entry = renderApp();
  });

  afterEach(() => {
    act(() => entry.root.unmount());
    entry.container.remove();
    document.body.innerHTML = '';
  });

  it('renders closed gates for encoder and decoder', () => {
    for (const id of ['home', 'encode', 'decode', 'how', 'privacy']) {
      expect(document.getElementById(id), `#${id}`).toBeTruthy();
    }
    expect(document.getElementById('history'), 'history removed').toBeNull();
    expect(document.querySelector('footer.footer')).toBeTruthy();
    expect(document.querySelector('.navbar')).toBeTruthy();
    expect(document.querySelector('canvas.particles')).toBeTruthy();
    expect(bodyText()).toContain('Emoji Code');
    expect(bodyText()).toContain('Open Encoder');
    expect(bodyText()).toContain('Open Decoder');
    expect(document.querySelector('#encode textarea')).toBeNull();
    expect(document.querySelector('#decode textarea')).toBeNull();
    expect(document.querySelectorAll('.step').length).toBe(7);
    expect(bodyText()).not.toContain('undefined');
    expect(bodyText()).not.toContain('[object Object]');
    expect(bodyText()).not.toContain('Clear History');
  });

  it('opens the encoder from its gate button', async () => {
    await openSection('encode');
    expect(document.querySelector('#encode textarea')).toBeTruthy();
    expect(document.querySelector('.shortcut-hint')).toBeTruthy();
    expect(document.querySelector('#encode .section-gate')).toBeNull();
  });

  it('opens the decoder from its gate button', async () => {
    await openSection('decode');
    expect(document.querySelector('#decode textarea')).toBeTruthy();
    expect(document.querySelector('#decode .section-gate')).toBeNull();
  });

  it('locks the second format option behind Coming Soon', async () => {
    await openSection('encode');
    const buttons = Array.from(document.querySelectorAll('.segmented button'));
    const soon = buttons.find((button) => button.textContent.includes('Coming Soon'));
    expect(soon, 'Coming Soon button').toBeTruthy();
    expect(soon.disabled).toBe(true);
    expect(buttons.some((button) => button.textContent.includes('Custom Emoji'))).toBe(false);
    expect(document.querySelector('.emoji-slots')).toBeNull();
    expect(document.querySelector('.emoji-slot__button')).toBeNull();
  });

  it('encodes a message and decodes it back', async () => {
    await openSection('encode');
    await openSection('decode');

    const input = document.querySelector('#encode textarea');
    await act(async () => {
      setReactValue(input, 'Secret plans 🔥 123');
    });

    const encodeButton = document.querySelector('#encode button.btn--xl');
    await act(async () => {
      encodeButton.click();
      await wait(1700);
    });

    const codeNode = document.querySelector('.code-box__text');
    expect(codeNode, 'encoded code box').toBeTruthy();
    const code = codeNode.textContent.trim();
    expect(code).toContain('🔐');
    expect(bodyText()).toContain('Encoded Message');

    await act(async () => {
      window.dispatchEvent(new CustomEvent('emoji-code:load-decode', { detail: code }));
    });
    expect(document.querySelector('#decode textarea').value).toBe(code);

    const decodeButton = document.querySelector('#decode button.btn--xl');
    await act(async () => {
      decodeButton.click();
      await wait(700);
    });

    const decoded = document.querySelector('.decoded-box');
    expect(decoded, 'decoded box').toBeTruthy();
    expect(decoded.textContent).toBe('Secret plans 🔥 123');
  });

  it('flags damaged codes without crashing', async () => {
    await openSection('decode');
    await act(async () => {
      window.dispatchEvent(new CustomEvent('emoji-code:load-decode', { detail: '🔐🧩💥' }));
    });
    const decodeButton = document.querySelector('#decode button.btn--xl');
    await act(async () => {
      decodeButton.click();
      await wait(500);
    });
    expect(document.querySelector('.error-box')).toBeTruthy();
    expect(document.querySelector('.decoded-box')).toBeFalsy();
  });
});
