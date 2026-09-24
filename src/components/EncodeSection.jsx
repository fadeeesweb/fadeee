import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { encodeMessage, getSpacer, validateExpiration, MAX_TEXT_LENGTH, DEFAULT_EXPIRY_MS } from '../lib/codec.js';
import { THEME_ICONS, THEME_NAMES } from '../lib/pools.js';
import { copyText, shareText, readClipboardText } from '../lib/clipboard.js';
import { useToast } from './Toasts.jsx';
import EmojiPicker from './EmojiPicker.jsx';
import Countdown from './Countdown.jsx';

const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

export default function EncodeSection({ open, onOpen }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [mode, setMode] = useState('auto');
  const [theme, setTheme] = useState(0);
  const [emoji1, setEmoji1] = useState('🔴');
  const [emoji2, setEmoji2] = useState('🖤');
  const [useTwoEmojis, setUseTwoEmojis] = useState(true);
  const [customExpiry, setCustomExpiry] = useState(false);
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [previewTarget, setPreviewTarget] = useState(0);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [picker, setPicker] = useState({ open: false, target: 'emoji1' });
  const [showQr, setShowQr] = useState(false);
  const [qrError, setQrError] = useState('');
  const [burst, setBurst] = useState([]);
  const canvasRef = useRef(null);
  const burstTimer = useRef(null);

  const durationMs = useMemo(() => {
    const valid = validateExpiration(hours, minutes);
    if (!valid.ok) return 0;
    return valid.hours * 3600000 + valid.minutes * 60000;
  }, [hours, minutes]);

  useEffect(() => {
    if (!customExpiry) {
      setPreviewTarget(Date.now() + DEFAULT_EXPIRY_MS);
      return;
    }
    if (durationMs <= 0) {
      setPreviewTarget(0);
      return;
    }
    setPreviewTarget(Date.now() + durationMs);
  }, [customExpiry, durationMs]);

  useEffect(() => () => window.clearTimeout(burstTimer.current), []);

  const activeEmoji2 = useTwoEmojis ? emoji2 : '';
  const spacer = getSpacer(emoji1);

  const randomizeTheme = useCallback(() => {
    let next = Math.floor(Math.random() * THEME_NAMES.length);
    if (next === theme) next = (next + 1) % THEME_NAMES.length;
    setTheme(next);
    toast.push(`Emoji theme: ${THEME_NAMES[next]}`, 'info');
  }, [theme, toast]);

  const handleEncode = useCallback(async () => {
    if (busy) return;
    if (text.trim().length === 0) {
      toast.push('Please enter a message.', 'error');
      return;
    }
    if (customExpiry) {
      const valid = validateExpiration(hours, minutes);
      if (!valid.ok) {
        toast.push(valid.message, 'error');
        return;
      }
    }

    setBusy(true);
    setQrError('');
    try {
      const [encoded] = await Promise.all([
        encodeMessage(text, {
          mode,
          theme,
          emoji1,
          emoji2: activeEmoji2,
          expires: customExpiry,
          hours,
          minutes,
        }),
        delay(430),
      ]);
      setResult(encoded);
      setPreviewTarget(encoded.expiry || 0);
      toast.push('Emoji Code generated.', 'success');
      setBurst(
        Array.from({ length: 7 }, (_, index) => ({
          id: `${Date.now()}-${index}`,
          emoji: ['✨', '🔐', '❤️', '🖤', '🔴', '💫', '🎉'][index],
        }))
      );
      window.clearTimeout(burstTimer.current);
      burstTimer.current = window.setTimeout(() => setBurst([]), 1400);
    } catch (error) {
      toast.push(error && error.message ? error.message : 'Unable to encode this message.', 'error');
    } finally {
      setBusy(false);
    }
  }, [activeEmoji2, busy, customExpiry, emoji1, hours, minutes, mode, text, theme, toast]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const ok = await copyText(result.code);
    if (ok) {
      setCopied(true);
      toast.push('Copied!', 'success');
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      toast.push('Copy failed. Select the code and copy it manually.', 'error');
    }
  }, [result, toast]);

  const handleShare = useCallback(async () => {
    if (!result) return;
    const status = await shareText('Emoji Code', result.code);
    if (status.status === 'shared') {
      toast.push('Share sheet opened.', 'success');
    } else if (status.status === 'cancelled') {
      toast.push('Sharing cancelled.', 'info');
    } else if (status.status === 'copied') {
      toast.push("Sharing isn't supported here, so the code was copied to your clipboard.", 'info', 4600);
    } else {
      toast.push('Unable to share or copy this code.', 'error');
    }
  }, [result, toast]);

  const handleClear = useCallback(() => {
    setText('');
    setResult(null);
    setCopied(false);
    setShowQr(false);
    setQrError('');
    setPreviewTarget(0);
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (mode !== 'auto') return;
    let next = Math.floor(Math.random() * THEME_NAMES.length);
    if (next === theme) next = (next + 1) % THEME_NAMES.length;
    setTheme(next);
    if (text.trim().length === 0) return;
    setBusy(true);
    try {
      const encoded = await encodeMessage(text, {
        mode: 'auto',
        theme: next,
        expires: customExpiry,
        hours,
        minutes,
      });
      setResult(encoded);
      toast.push(`Regenerated with theme: ${THEME_NAMES[next]}`, 'success');
    } catch (error) {
      toast.push(error && error.message ? error.message : 'Unable to regenerate.', 'error');
    } finally {
      setBusy(false);
    }
  }, [customExpiry, hours, minutes, mode, text, theme, toast]);

  const handlePaste = useCallback(async () => {
    const result = await readClipboardText();
    if (result.ok) {
      setText((value) => `${value}${value && !value.endsWith(' ') ? ' ' : ''}${result.text}`);
      toast.push('Pasted from clipboard.', 'success');
    } else {
      toast.push(result.message, 'error');
    }
  }, [toast]);

  const normalizeHours = useCallback(() => {
    let value = Number(hours);
    if (!Number.isFinite(value)) value = 0;
    if (value < 0) {
      toast.push('Hours cannot be negative.', 'error');
      value = 0;
    }
    if (value > 24) {
      toast.push('Hours cannot be greater than 24.', 'error');
      value = 24;
    }
    setHours(String(Math.floor(value)));
  }, [hours, toast]);

  const normalizeMinutes = useCallback(() => {
    let value = Number(minutes);
    if (!Number.isFinite(value)) value = 0;
    if (value < 0) {
      toast.push('Minutes must be between 0 and 59.', 'error');
      value = 0;
    }
    let extraHours = 0;
    if (value > 59) {
      extraHours = Math.floor(value / 60);
      value = value % 60;
    }
    if (extraHours > 0) {
      const current = Math.max(0, Math.floor(Number(hours) || 0));
      const total = Math.min(24, current + extraHours);
      setHours(String(total));
      toast.push(`Normalized to ${total}h ${value}m.`, 'info');
    }
    setMinutes(String(value));
  }, [hours, minutes, toast]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleEncode();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleEncode]);

  useEffect(() => {
    if (!showQr || !result || !canvasRef.current) return undefined;
    let cancelled = false;
    QRCode.toCanvas(canvasRef.current, result.code, {
      width: 260,
      margin: 2,
      errorCorrectionLevel: 'L',
      color: { dark: '#0b0b0d', light: '#ffffff' },
    }).catch(() => {
      if (!cancelled) setQrError('This code is too long to fit in a QR code.');
    });
    return () => {
      cancelled = true;
    };
  }, [showQr, result, qrError]);

  const downloadQr = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'emoji-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.push('QR code downloaded.', 'success');
    } catch (error) {
      toast.push('Unable to download the QR code.', 'error');
    }
  }, [toast]);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_TEXT_LENGTH;

  if (!open) {
    return (
      <section className="section" id="encode">
        <div className="container">
          <div className="section-gate glass reveal">
            <span className="eyebrow">01 · Encoder</span>
            <h2>Encode Message</h2>
            <p>
              The encoder is closed. Press the button to open it and turn your message into an emoji code.
            </p>
            <button type="button" className="btn btn--primary btn--lg" onClick={() => onOpen('encode')}>
              Open Encoder
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section" id="encode">
      <div className="container">
        <header className="section-head reveal">
          <span className="eyebrow">01 · Encoder</span>
          <h2>Encode Message</h2>
          <p>Turn your message into an emoji code.</p>
        </header>

        <div className="split">
          <div className="glass card reveal">
            <div className="card__head">
              <h3>Your message</h3>
              <span className={`counter ${isOverLimit ? 'is-over' : ''}`}>
                {charCount.toLocaleString('en-US')} / {MAX_TEXT_LENGTH.toLocaleString('en-US')}
              </span>
            </div>

            <label className="sr-only" htmlFor="encode-input">
              Message to encode
            </label>
            <textarea
              id="encode-input"
              className="textarea"
              placeholder="Write your secret message..."
              value={text}
              maxLength={MAX_TEXT_LENGTH + 500}
              rows={6}
              onChange={(event) => setText(event.target.value)}
            />

            <div className="row row--between">
              <button type="button" className="link-btn" onClick={handlePaste}>
                Paste message
              </button>
              {text.length > 0 ? (
                <button type="button" className="link-btn link-btn--danger" onClick={() => setText('')}>
                  Clear
                </button>
              ) : null}
            </div>

            <fieldset className="field-group">
              <legend>Encoding Format</legend>
              <div className="segmented" data-active={mode}>
                <span className="segmented__pill" aria-hidden="true" />
                <button
                  type="button"
                  className={mode === 'auto' ? 'is-active' : ''}
                  aria-pressed={mode === 'auto'}
                  onClick={() => setMode('auto')}
                >
                  Auto Emoji
                </button>
                <button
                  type="button"
                  className="segmented__soon"
                  disabled
                  aria-disabled="true"
                  title="Custom Emoji is coming soon"
                >
                  Coming Soon
                </button>
              </div>
            </fieldset>

            {mode === 'auto' ? (
              <div className="settings-block">
                <div className="field-group">
                  <label htmlFor="theme-select">Auto emoji theme</label>
                  <div className="input-row">
                    <select
                      id="theme-select"
                      className="select"
                      value={theme}
                      onChange={(event) => setTheme(Number(event.target.value))}
                    >
                      {THEME_NAMES.map((name, index) => (
                        <option key={name} value={index}>
                          {THEME_ICONS[index]} Theme {index + 1} — {name}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={randomizeTheme}>
                      🎲 Random
                    </button>
                  </div>
                </div>
                <p className="hint">
                  The decoder supports every theme automatically — the chosen theme travels inside the code.
                </p>
              </div>
            ) : (
              <div className="settings-block">
                <div className="emoji-slots">
                  <div className="emoji-slot">
                    <span className="emoji-slot__label" id="emoji1-label">
                      Emoji 1
                    </span>
                    <button
                      type="button"
                      className="emoji-slot__button"
                      onClick={() => setPicker({ open: true, target: 'emoji1' })}
                      aria-describedby="emoji1-label"
                      aria-label={`Emoji 1: ${emoji1}. Change emoji`}
                    >
                      {emoji1}
                    </button>
                  </div>
                  <div className="emoji-slot">
                    <span className="emoji-slot__label" id="emoji2-label">
                      Emoji 2 <em>optional</em>
                    </span>
                    <div className="emoji-slot__group">
                      <button
                        type="button"
                        className="emoji-slot__button"
                        onClick={() => setPicker({ open: true, target: 'emoji2' })}
                        aria-describedby="emoji2-label"
                        aria-label={`Emoji 2: ${useTwoEmojis ? emoji2 : 'not used'}. Change emoji`}
                      >
                        {useTwoEmojis ? emoji2 : '?'}
                      </button>
                      <button
                        type="button"
                        className={`chip-btn ${useTwoEmojis ? 'is-active' : ''}`}
                        onClick={() => setUseTwoEmojis((value) => !value)}
                        aria-pressed={useTwoEmojis}
                      >
                        {useTwoEmojis ? '2 emojis' : '1 emoji'}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="hint">
                  {useTwoEmojis ? (
                    <>
                      Codes will use <b>{emoji1}</b> and <b>{emoji2}</b> only.
                    </>
                  ) : (
                    <>
                      Codes will use <b>{emoji1}</b> as the symbol and <b>{spacer}</b> as the spacer.
                    </>
                  )}
                </p>
              </div>
            )}

            <fieldset className="field-group expiration">
              <div className="expiration__head">
                <legend>Expiration</legend>
                <div className="toggle" data-on={customExpiry ? 'true' : 'false'}>
                  <button
                    type="button"
                    className={!customExpiry ? 'is-active' : ''}
                    aria-pressed={!customExpiry}
                    onClick={() => setCustomExpiry(false)}
                  >
                    24 Hours
                  </button>
                  <button
                    type="button"
                    className={customExpiry ? 'is-active' : ''}
                    aria-pressed={customExpiry}
                    onClick={() => setCustomExpiry(true)}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {!customExpiry ? (
                <div className="expiration__body">
                  <div className="countdown-preview">
                    <span className="countdown-preview__label">
                      <span className="pulse-dot" aria-hidden="true" /> Expires in:
                    </span>
                    <Countdown target={previewTarget} className="countdown--lg" />
                  </div>
                  <p className="hint">
                    Every code expires automatically 24 hours after it is created — no option to keep
                    it longer.
                  </p>
                </div>
              ) : null}

              {customExpiry ? (
                <div className="expiration__body">
                  <div className="time-fields">
                    <div className="time-field">
                      <label htmlFor="hours-input">Hours</label>
                      <input
                        id="hours-input"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="24"
                        step="1"
                        value={hours}
                        onChange={(event) => setHours(event.target.value)}
                        onBlur={normalizeHours}
                      />
                    </div>
                    <div className="time-field">
                      <label htmlFor="minutes-input">Minutes</label>
                      <input
                        id="minutes-input"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="59"
                        step="1"
                        value={minutes}
                        onChange={(event) => setMinutes(event.target.value)}
                        onBlur={normalizeMinutes}
                      />
                    </div>
                  </div>
                  <div className="countdown-preview">
                    <span className="countdown-preview__label">
                      <span className="pulse-dot" aria-hidden="true" /> Expires in:
                    </span>
                    {previewTarget ? (
                      <Countdown target={previewTarget} className="countdown--lg" />
                    ) : (
                      <span className="countdown countdown--lg">--:--:--</span>
                    )}
                  </div>
                  <p className="hint">Maximum 24 hours. The countdown resets whenever you change the values.</p>
                </div>
              ) : null}
            </fieldset>

            <button
              type="button"
              className={`btn btn--primary btn--block btn--xl ${busy ? 'is-busy' : ''}`}
              onClick={handleEncode}
              disabled={busy}
            >
              <span className="btn__label">{busy ? 'Coding…' : 'Code Message'}</span>
              <span className="btn__shine" aria-hidden="true" />
            </button>
            <p className="shortcut-hint">
              Shortcut: <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
            </p>
          </div>

          <div className="glass card card--result reveal">
            <div className="card__head">
              <h3>Encoded Message</h3>
              {result ? (
                <div className="badges">
                  <span className="badge">{result.format === 'auto' ? 'Auto Emoji' : 'Custom Emoji'}</span>
                  {result.expiry ? <span className="badge badge--red">Expires</span> : null}
                </div>
              ) : null}
            </div>

            {!result ? (
              <div className="result-empty">
                <span className="result-empty__icon" aria-hidden="true">
                  🔐
                </span>
                <p>Your emoji code will appear here.</p>
                <p className="hint">Write a message, pick a format, then hit Code Message.</p>
              </div>
            ) : (
              <>
                <div className="code-box">
                  <div className="code-box__text" aria-label="Encoded emoji code" tabIndex={0}>
                    {result.code}
                  </div>
                  <div className="burst" aria-hidden="true">
                    {burst.map((item) => (
                      <span key={item.id}>{item.emoji}</span>
                    ))}
                  </div>
                </div>

                <div className="result-meta">
                  <span>{result.symbolCount.toLocaleString('en-US')} symbols</span>
                  <span>{result.charCount.toLocaleString('en-US')} characters</span>
                  <span>
                    {result.format === 'auto'
                      ? `Theme ${result.theme + 1} · ${THEME_NAMES[result.theme] || ''}`
                      : `Custom · ${result.theme} emoji${result.theme === 2 ? 's' : ''}`}
                  </span>
                </div>

                <div className="expiry-strip">
                  <span className="badge badge--red">Expires in</span>
                  <Countdown target={result.expiry} />
                </div>

                <div className="btn-row">
                  <button type="button" className={`btn btn--primary ${copied ? 'is-copied' : ''}`} onClick={handleCopy}>
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={handleShare}>
                    Share
                  </button>
                  {mode === 'auto' ? (
                    <button type="button" className="btn btn--ghost" onClick={handleRegenerate} disabled={busy}>
                      Regenerate
                    </button>
                  ) : null}
                  <button type="button" className="btn btn--ghost" onClick={() => setShowQr((value) => !value)}>
                    {showQr ? 'Hide QR' : 'QR Code'}
                  </button>
                  <button type="button" className="btn btn--ghost btn--danger" onClick={handleClear}>
                    Clear
                  </button>
                </div>

                {showQr ? (
                  <div className="qr-panel">
                    {qrError ? (
                      <div className="qr-panel__fallback" aria-hidden="true">
                        📷
                      </div>
                    ) : (
                      <canvas ref={canvasRef} className="qr-panel__canvas" aria-label="QR code for this emoji code" />
                    )}
                    <div className="qr-panel__actions">
                      {!qrError ? (
                        <button type="button" className="btn btn--ghost btn--sm" onClick={downloadQr}>
                          Download QR
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          setShowQr(false);
                          setQrError('');
                        }}
                      >
                        Close
                      </button>
                    </div>
                    {qrError ? (
                      <p className="field-error" role="alert">
                        {qrError}
                      </p>
                    ) : (
                      <p className="hint">Generated in your browser. Scan it to read the code.</p>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <EmojiPicker
        open={picker.open}
        target={picker.target}
        current={picker.target === 'emoji1' ? emoji1 : emoji2}
        onPick={(emoji) => {
          if (picker.target === 'emoji1') setEmoji1(emoji);
          else setEmoji2(emoji);
          setPicker({ open: false, target: picker.target });
        }}
        onClose={() => setPicker((value) => ({ ...value, open: false }))}
      />
    </section>
  );
}
