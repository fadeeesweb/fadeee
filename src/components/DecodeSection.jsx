import { useCallback, useEffect, useState } from 'react';
import { decodeMessage } from '../lib/codec.js';
import { copyText, readClipboardText } from '../lib/clipboard.js';
import { THEME_NAMES } from '../lib/pools.js';
import { formatDuration } from '../lib/format.js';
import useNow from '../hooks/useNow.js';
import { useToast } from './Toasts.jsx';
import Countdown from './Countdown.jsx';

const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

export default function DecodeSection({ open, onOpen }) {
  const toast = useToast();
  const now = useNow(1000);
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDecode = useCallback(async () => {
    if (busy) return;
    if (code.trim().length === 0) {
      toast.push('Please paste an Emoji Code to decode.', 'error');
      return;
    }
    setBusy(true);
    try {
      const [decoded] = await Promise.all([decodeMessage(code), delay(380)]);
      setResult(decoded);
      if (decoded.ok) {
        if (decoded.expired) {
          toast.push('This message has expired.', 'error', 4200);
        } else {
          toast.push('Message decoded.', 'success');
        }
      } else {
        toast.push(decoded.message, 'error', 4200);
      }
    } catch (error) {
      setResult({
        ok: false,
        message: 'Unable to decode this message. Make sure the emoji code was created by Emoji Code.',
      });
      toast.push('Unable to decode this message.', 'error');
    } finally {
      setBusy(false);
    }
  }, [busy, code, toast]);

  const handleCopy = useCallback(async () => {
    if (!result || !result.ok || result.expired) return;
    const ok = await copyText(result.text);
    if (ok) {
      setCopied(true);
      toast.push('Copied!', 'success');
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      toast.push('Copy failed. Select the message and copy it manually.', 'error');
    }
  }, [result, toast]);

  const handleClear = useCallback(() => {
    setCode('');
    setResult(null);
    setCopied(false);
  }, []);

  const handlePaste = useCallback(async () => {
    const pasted = await readClipboardText();
    if (pasted.ok) {
      setCode(pasted.text);
      toast.push('Pasted from clipboard.', 'success');
    } else {
      toast.push(pasted.message, 'error');
    }
  }, [toast]);

  useEffect(() => {
    const onLoad = (event) => {
      if (typeof event.detail === 'string') {
        setCode(event.detail);
        setResult(null);
        setCopied(false);
      }
    };
    window.addEventListener('emoji-code:load-decode', onLoad);
    return () => window.removeEventListener('emoji-code:load-decode', onLoad);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        handleDecode();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleDecode]);

  const isExpiredNow = Boolean(result && result.ok && result.expiry && now > result.expiry);
  const expired = Boolean(result && result.ok && (result.expired || isExpiredNow));
  const remaining = result && result.expiry ? Math.max(0, result.expiry - now) : 0;

  if (!open) {
    return (
      <section className="section section--alt" id="decode">
        <div className="container">
          <div className="section-gate glass reveal">
            <span className="eyebrow">02 · Decoder</span>
            <h2>Decode Message</h2>
            <p>
              The decoder is closed. Press the button to open it and paste an emoji code to reveal the
              original message.
            </p>
            <button type="button" className="btn btn--primary btn--lg" onClick={() => onOpen('decode')}>
              Open Decoder
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section section--alt" id="decode">
      <div className="container">
        <header className="section-head reveal">
          <span className="eyebrow">02 · Decoder</span>
          <h2>Decode Message</h2>
          <p>Paste an Emoji Code to reveal the original message.</p>
        </header>

        <div className="split">
          <div className="glass card reveal">
            <div className="card__head">
              <h3>Emoji code</h3>
              <span className="counter">{code.length.toLocaleString('en-US')} chars</span>
            </div>

            <label className="sr-only" htmlFor="decode-input">
              Emoji code to decode
            </label>
            <textarea
              id="decode-input"
              className="textarea textarea--code"
              placeholder="Paste emoji code here..."
              value={code}
              rows={7}
              onChange={(event) => setCode(event.target.value)}
            />

            <div className="row row--between">
              <button type="button" className="link-btn" onClick={handlePaste}>
                Paste from clipboard
              </button>
              {code.length > 0 ? (
                <button type="button" className="link-btn link-btn--danger" onClick={() => setCode('')}>
                  Clear
                </button>
              ) : null}
            </div>

            <button
              type="button"
              className={`btn btn--primary btn--block btn--xl ${busy ? 'is-busy' : ''}`}
              onClick={handleDecode}
              disabled={busy}
            >
              <span className="btn__label">{busy ? 'Decoding…' : 'Decode Message'}</span>
              <span className="btn__shine" aria-hidden="true" />
            </button>
            <p className="shortcut-hint">
              Shortcut: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Enter</kbd> · One button detects both formats
            </p>
          </div>

          <div className="glass card card--result reveal">
            <div className="card__head">
              <h3>Decoded Message</h3>
              {result && result.ok ? (
                <div className="badges">
                  <span className={`badge ${expired ? 'badge--danger' : 'badge--success'}`}>
                    Message Status: {expired ? 'EXPIRED' : 'ACTIVE'}
                  </span>
                </div>
              ) : null}
            </div>

            {!result ? (
              <div className="result-empty">
                <span className="result-empty__icon" aria-hidden="true">
                  🔓
                </span>
                <p>Your original message will appear here.</p>
                <p className="hint">Auto Emoji and Custom Emoji codes are detected automatically.</p>
              </div>
            ) : null}

            {result && !result.ok ? (
              <div className="error-box" role="alert">
                <span className="error-box__icon" aria-hidden="true">
                  ⚠
                </span>
                <div>
                  <strong>Unable to decode</strong>
                  <p>{result.message}</p>
                </div>
              </div>
            ) : null}

            {result && result.ok && expired ? (
              <div className="expired-box" role="alert">
                <span className="expired-box__icon" aria-hidden="true">
                  ⏳
                </span>
                <h4>This message has expired</h4>
                <p>THIS MESSAGE HAS EXPIRED</p>
                <div className="expired-box__time">
                  <span className="badge badge--danger">Message Status: EXPIRED</span>
                  <span className="countdown countdown--danger">{formatDuration(remaining)}</span>
                </div>
                <p className="hint">The original text stays hidden forever. Ask for a new code.</p>
              </div>
            ) : null}

            {result && result.ok && !expired ? (
              <>
                <div className="status-strip">
                  <span className={`badge ${result.expiry ? 'badge--success' : ''}`}>
                    {result.format === 'auto' ? 'Auto Emoji' : 'Custom Emoji'}
                  </span>
                  <span className="hint">
                    {result.format === 'auto'
                      ? THEME_NAMES[result.theme] || 'Theme'
                      : `${result.theme} custom emoji${result.theme === 2 ? 's' : ''}`}
                  </span>
                  {result.expiry ? <Countdown target={result.expiry} className="countdown--sm" /> : null}
                </div>

                <div className="decoded-box" aria-label="Decoded message" tabIndex={0}>
                  {result.text}
                </div>

                <div className="btn-row">
                  <button
                    type="button"
                    className={`btn btn--primary ${copied ? 'is-copied' : ''}`}
                    onClick={handleCopy}
                  >
                    {copied ? 'Copied!' : 'Copy Message'}
                  </button>
                  <button type="button" className="btn btn--ghost btn--danger" onClick={handleClear}>
                    Clear
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
