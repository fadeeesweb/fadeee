import { useEffect, useState } from 'react';
import spide from '../assets/spidee.webp';

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'encode', label: 'Encode' },
  { id: 'decode', label: 'Decode' },
  { id: 'how', label: 'How It Works' },
  { id: 'privacy', label: 'Privacy' },
];

export default function Navbar({ onOpen }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('home');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const sections = LINKS.map((link) => document.getElementById(link.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0.01, 0.2, 0.5] }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <nav className="navbar__inner" aria-label="Primary">
        <a
          className="navbar__brand"
          href="#home"
          onClick={() => setOpen(false)}
          aria-label="Emoji Code home"
        >
          <span className="navbar__mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="30" height="30" role="img">
              <rect x="2" y="2" width="44" height="44" rx="14" fill="rgba(255,45,79,0.12)" />
              <circle cx="24" cy="24" r="13" fill="none" stroke="#ff2d4f" strokeWidth="4" />
              <circle cx="24" cy="24" r="5" fill="#ff2d4f" />
            </svg>
          </span>
          <span className="navbar__title">
            Emoji <span>Code</span>
          </span>
          <img className="navbar__spide" src={spide} alt="" aria-hidden="true" />
        </a>

        <button
          type="button"
          className={`navbar__toggle ${open ? 'is-open' : ''}`}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="primary-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`navbar__menu ${open ? 'is-open' : ''}`} id="primary-menu">
          <ul>
            {LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  className={active === link.id ? 'is-active' : ''}
                  aria-current={active === link.id ? 'page' : undefined}
                  onClick={(event) => {
                    if (link.id === 'encode' || link.id === 'decode') {
                      event.preventDefault();
                      if (onOpen) onOpen(link.id);
                    }
                    setOpen(false);
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            className="btn btn--primary navbar__cta"
            href="#encode"
            onClick={(event) => {
              event.preventDefault();
              if (onOpen) onOpen('encode');
              setOpen(false);
            }}
          >
            Start Encoding
          </a>
        </div>
      </nav>
      {open ? (
        <button
          type="button"
          className="navbar__backdrop"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
      ) : null}
    </header>
  );
}
