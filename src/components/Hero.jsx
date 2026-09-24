import { useEffect, useState } from 'react';
import { encodeMessage } from '../lib/codec.js';
import funny1 from '../assets/floaters/funny-1.jpg';
import funny2 from '../assets/floaters/funny-2.jpg';
import funny3 from '../assets/floaters/funny-3.jpg';
import funny4 from '../assets/floaters/funny-4.jpg';
import funny5 from '../assets/floaters/funny-5.jpg';
import funny6 from '../assets/floaters/funny-6.jpg';

const DEMO_TEXTS = ['Hello World', 'Meet me at 8', 'You are invited 🎉'];
const FLOATERS = [funny1, funny2, funny3, funny4, funny5, funny6];
const FLOATER_COUNT = 8;

export default function Hero({ onOpen }) {
  const [codes, setCodes] = useState([]);
  const [index, setIndex] = useState(0);

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
    <section className="hero" id="home">
      <div className="hero__floaters" aria-hidden="true">
        {Array.from({ length: FLOATER_COUNT }, (_, position) => (
          <span
            key={position}
            className={`hero__floater hero__floater--${position + 1}`}
            style={{ animationDelay: `${position * 0.75}s` }}
          >
            <img src={FLOATERS[position % FLOATERS.length]} alt="" />
          </span>
        ))}
      </div>

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
