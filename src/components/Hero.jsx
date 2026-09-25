import { useEffect, useRef, useState } from 'react';
import { encodeMessage } from '../lib/codec.js';
import floaterSrc from '../assets/floaters/floater.webp';
import floaterAudio from '../assets/floaters/floater-audio.m4a';

const DEMO_TEXTS = ['Hello World', 'Meet me at 8', 'You are invited 🎉'];
const FLOATER_COUNT = 8;

export default function Hero({ onOpen }) {
  const [codes, setCodes] = useState([]);
  const [index, setIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef(null);

  const toggleSound = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (soundOn) {
      audio.pause();
      audio.currentTime = 0;
      setSoundOn(false);
    } else {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      setSoundOn(true);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all(DEMO_TEXTS.map((text) => encodeMessage(text, { mode: 'auto', theme: 0 })))
      .then((results) => {
        if (!cancelled) setCodes(results.map((result) => result.code));
      })
      .catch(() => {
        if (!cancelled) setCodes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((value) => (value + 1) % DEMO_TEXTS.length), 4200);
    return () => window.clearInterval(id);
  }, []);

  const text = DEMO_TEXTS[index] ?? DEMO_TEXTS[0];
  const code = codes[index] ?? '';

  return (
    <section
      className="hero"
      id="home"
      onClick={(event) => {
        if (event.target.closest('button, a, input, textarea, select, label, .floater-hint')) return;
        const selection = window.getSelection ? String(window.getSelection()) : '';
        if (selection) return;
        const x = event.clientX;
        const y = event.clientY;
        const onFloater = Array.from(event.currentTarget.querySelectorAll('.hero__floater')).some((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return false;
          return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        });
        if (onFloater) toggleSound();
      }}
    >
      <div className={`hero__floaters${soundOn ? ' is-sound-on' : ''}`} aria-hidden="true">
        {Array.from({ length: FLOATER_COUNT }, (_, position) => (
          <span
            key={position}
            className={`hero__floater hero__floater--${position + 1}`}
            style={{ animationDelay: `${position * 0.75}s` }}
          >
            <img src={floaterSrc} alt="" />
          </span>
        ))}
        <span className="floater-hint">
          <span className="floater-hint__body">
            <svg viewBox="0 0 106 52" aria-hidden="true">
              <defs>
                <linearGradient
                  id="hintGrad"
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2="53"
                  y2="0"
                  spreadMethod="repeat"
                >
                  <stop offset="0" stopColor="#e60000" />
                  <stop offset="1" stopColor="#ffffff" />
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    from="0 0"
                    to="53 0"
                    dur="3.5s"
                    repeatCount="indefinite"
                  />
                </linearGradient>
              </defs>
              <text x="1" y="21">click</text>
              <text x="1" y="44">here</text>
              <path className="floater-hint__line" d="M58 43 Q 80 42 99 28" />
              <path className="floater-hint__head" d="M95 36 L 100 27 L 90 27" />
            </svg>
          </span>
        </span>
      </div>
      <audio
        ref={audioRef}
        src={floaterAudio}
        preload="auto"
        onEnded={() => setSoundOn(false)}
      />

      <div className="container hero__inner">
        <div className="hero__copy reveal">
          <span className="eyebrow">100% local · no server · no tracking</span>
          <h1 className="hero__title">
            EMOJI <span>CODE</span>
          </h1>
          <p className="hero__subtitle">
            Turn ordinary messages into extraordinary emoji codes.
          </p>
          <div className="hero__actions">
            <button type="button" className="btn btn--primary btn--lg" onClick={() => onOpen('encode')}>
              Start Encoding
            </button>
            <button type="button" className="btn btn--ghost btn--lg" onClick={() => onOpen('decode')}>
              Decode Message
            </button>
          </div>
          <p className="hero__note">
            Encoding, not encryption. Your text is scrambled into emoji symbols inside your browser and
            can be reversed by anyone with this site.
          </p>
        </div>

        <div className="hero__demo reveal" aria-hidden="true">
          <div className="demo-card glass float-slow">
            <div className="demo-card__head">
              <span className="demo-dot" />
              <span className="demo-dot" />
              <span className="demo-dot" />
              <span className="demo-card__label">Live example</span>
            </div>

            <div className="demo-step">
              <span className="demo-step__label">TEXT</span>
              <code className="demo-step__value">{text}</code>
            </div>
            <div className="demo-arrow">↓</div>
            <div className="demo-step demo-step--code">
              <span className="demo-step__label">EMOJI CODE</span>
              <code className="demo-step__value demo-step__value--code">{code || '…'}</code>
            </div>
            <div className="demo-arrow">↓</div>
            <div className="demo-step">
              <span className="demo-step__label">TEXT</span>
              <code className="demo-step__value">{text}</code>
            </div>

            <div className="demo-card__dots">
              {DEMO_TEXTS.map((item, position) => (
                <span key={item} className={position === index ? 'is-active' : ''} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <a
        className="hero__scroll"
        href="#encode"
        aria-label="Open the encoder"
        onClick={(event) => {
          event.preventDefault();
          onOpen('encode');
        }}
      >
        <span>Open</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}
