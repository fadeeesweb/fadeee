const STEPS = [
  { number: '01', title: 'Write your message', text: 'Type anything: text, numbers, emoji, Urdu, multiline.' },
  { number: '02', title: 'Choose your emoji format', text: 'Pick Auto Emoji with a theme, or bring your own 1 or 2 emojis.' },
  { number: '03', title: 'Every code expires in 24 hours', text: 'Auto-expiry is stored inside the code itself. Pick a shorter custom timer if you want.' },
  { number: '04', title: 'Generate your Emoji Code', text: 'One click scrambles everything locally — each code is unique, even for the same message.' },
  { number: '05', title: 'Send it anywhere', text: 'Copy or share it over any chat, email or social app.' },
  { number: '06', title: 'Receiver pastes it into Emoji Code', text: 'The decoder detects the format automatically.' },
  { number: '07', title: 'Original message appears', text: 'Checksum verified, 24-hour expiry checked, text restored.' },
];

export default function HowItWorks() {
  return (
    <section className="section section--alt" id="how">
      <div className="container">
        <header className="section-head reveal">
          <span className="eyebrow">04 · Workflow</span>
          <h2>How It Works</h2>
          <p>Seven simple steps, zero servers involved.</p>
        </header>

        <ol className="steps">
          {STEPS.map((step) => (
            <li className="step glass reveal" key={step.number}>
              <span className="step__number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="note-card glass reveal">
          <strong>Encoding is not encryption.</strong>
          <p>
            Emoji Code scrambles your text into emoji symbols with a checksum so it can be reversed
            reliably. It does not make a message secret from someone who understands the format — use
            real encryption tools when you need confidentiality.
          </p>
        </div>
      </div>
    </section>
  );
}
