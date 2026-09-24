const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'encode', label: 'Encode' },
  { id: 'decode', label: 'Decode' },
  { id: 'how', label: 'How It Works' },
  { id: 'privacy', label: 'Privacy' },
];

export default function Footer({ onOpen }) {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <span className="footer__logo">Emoji Code</span>
          <p>Private. Local. Emoji-powered.</p>
        </div>

        <nav className="footer__links" aria-label="Footer">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(event) => {
                if (link.id === 'encode' || link.id === 'decode') {
                  event.preventDefault();
                  if (onOpen) onOpen(link.id);
                }
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="footer__meta">
          <p>Built for fun and private local message encoding.</p>
          <p className="footer__fine">
            Encoding only — not encryption, not military grade security. No analytics, no trackers, no
            backend.
          </p>
        </div>
      </div>
      <div className="footer__bar">
        <div className="container">
          <span>© {new Date().getFullYear()} Emoji Code</span>
          <span>Runs fully in your browser</span>
        </div>
      </div>
    </footer>
  );
}
