import { useEffect, useMemo, useRef, useState } from 'react';
import { PICKER_CATEGORIES } from '../data/pickerEmojis.js';
import { normalizeEmojiChoice } from '../lib/emoji.js';

export default function EmojiPicker({ open, target = 'emoji1', current = '', onPick, onClose }) {
  const [category, setCategory] = useState(PICKER_CATEGORIES[0].id);
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState('');
  const dialogRef = useRef(null);
  const searchRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    restoreRef.current = document.activeElement;
    setDraft('');
    setDraftError('');
    const focusTimer = window.setTimeout(() => {
      if (searchRef.current) searchRef.current.focus();
    }, 30);
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button, input, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKey, true);
      const restore = restoreRef.current;
      if (restore && typeof restore.focus === 'function') {
        window.setTimeout(() => restore.focus(), 0);
      }
    };
  }, [open, onClose]);

  const active = useMemo(
    () => PICKER_CATEGORIES.find((item) => item.id === category) || PICKER_CATEGORIES[0],
    [category]
  );

  const emojis = useMemo(() => Array.from(new Set(active.emojis.split(/\s+/).filter(Boolean))), [active]);

  if (!open) return null;

  const submitDraft = () => {
    const symbol = normalizeEmojiChoice(draft);
    if (!symbol) {
      setDraftError('That does not look like a single emoji.');
      return;
    }
    onPick(symbol);
  };

  return (
    <div className="picker-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="picker glass"
        role="dialog"
        aria-modal="true"
        aria-label={`Choose emoji for ${target === 'emoji1' ? 'Emoji 1' : 'Emoji 2'}`}
        ref={dialogRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="picker__head">
          <div>
            <span className="eyebrow">Choose Emoji</span>
            <h3>{target === 'emoji1' ? 'Emoji 1' : 'Emoji 2'}</h3>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close emoji picker">
            ×
          </button>
        </div>

        <div className="picker__search">
          <label className="sr-only" htmlFor="picker-draft">
            Paste your own emoji
          </label>
          <input
            id="picker-draft"
            ref={searchRef}
            type="text"
            value={draft}
            placeholder="Paste any emoji here…"
            onChange={(event) => {
              setDraft(event.target.value);
              setDraftError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitDraft();
              }
            }}
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={submitDraft}>
            Use
          </button>
        </div>
        {draftError ? (
          <p className="field-error" role="alert">
            {draftError}
          </p>
        ) : null}

        <div className="picker__tabs" role="tablist" aria-label="Emoji categories">
          {PICKER_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === category}
              className={item.id === category ? 'is-active' : ''}
              onClick={() => setCategory(item.id)}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="picker__grid" role="tabpanel" aria-label={`${active.label} emojis`}>
          {emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={emoji === current ? 'is-selected' : ''}
              onClick={() => onPick(emoji)}
              aria-label={`Select ${emoji}`}
              aria-pressed={emoji === current}
            >
              {emoji}
            </button>
          ))}
        </div>

        <p className="picker__hint">
          Selected emoji is used as a real symbol in your code. Press <kbd>Esc</kbd> to close.
        </p>
      </div>
    </div>
  );
}
