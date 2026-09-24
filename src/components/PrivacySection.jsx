export default function PrivacySection() {
  return (
    <section className="section" id="privacy">
      <div className="container">
        <header className="section-head reveal">
          <span className="eyebrow">05 · Privacy</span>
          <h2>Privacy</h2>
          <p>Plain facts about what happens to your messages.</p>
        </header>

        <div className="privacy-grid">
          <article className="glass card reveal">
            <span className="privacy-icon" aria-hidden="true">
              🕵️
            </span>
            <h3>Local processing</h3>
            <p>
              Your messages are processed locally in your browser. We do not send your messages to a
              server.
            </p>
          </article>

          <article className="glass card reveal">
            <span className="privacy-icon" aria-hidden="true">
              📡
            </span>
            <h3>No network calls</h3>
            <p>
              This is a static site. After the page loads, encoding, decoding and QR generation all run
              on your device without any API.
            </p>
          </article>

          <article className="glass card reveal">
            <span className="privacy-icon" aria-hidden="true">
              📝
            </span>
            <h3>Nothing is saved</h3>
            <p>
              There is no history and no account. Your message only lives in this tab while you use it —
              reload the page and it is gone.
            </p>
          </article>

          <article className="glass card reveal">
            <span className="privacy-icon" aria-hidden="true">
              ⚠️
            </span>
            <h3>Not military grade</h3>
            <p>
              This is an emoji encoding system with a SHA-256 integrity check, not a replacement for
              end-to-end encrypted messaging.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
