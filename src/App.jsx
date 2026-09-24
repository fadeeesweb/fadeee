import { useCallback, useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import EncodeSection from './components/EncodeSection.jsx';
import DecodeSection from './components/DecodeSection.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import PrivacySection from './components/PrivacySection.jsx';
import Footer from './components/Footer.jsx';
import Particles from './components/Particles.jsx';
import { ToastProvider } from './components/Toasts.jsx';

function useRevealOnScroll() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const seen = new WeakSet();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    const observeTree = (root) => {
      if (!root) return;
      if (root.nodeType === 1 && root.classList.contains('reveal') && !seen.has(root)) {
        seen.add(root);
        observer.observe(root);
      }
      if (typeof root.querySelectorAll === 'function') {
        root.querySelectorAll('.reveal').forEach((element) => {
          if (!seen.has(element)) {
            seen.add(element);
            observer.observe(element);
          }
        });
      }
    };

    observeTree(document.body);

    // Sections opened later (encode/decode) add new .reveal nodes - keep observing them.
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => observeTree(node));
      });
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    const safety = window.setTimeout(() => {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((element) => {
        const box = element.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) element.classList.add('is-visible');
      });
    }, 1500);

    return () => {
      observer.disconnect();
      mutations.disconnect();
      window.clearTimeout(safety);
    };
  }, []);
}

export default function App() {
  useRevealOnScroll();
  const [opened, setOpened] = useState({ encode: false, decode: false });

  const openSection = useCallback((name) => {
    if (name !== 'encode' && name !== 'decode') return;
    setOpened((previous) => (previous[name] ? previous : { ...previous, [name]: true }));
    if (window.location.hash !== `#${name}`) {
      window.history.replaceState(null, '', `#${name}`);
    }
    window.setTimeout(() => {
      const target = document.getElementById(name);
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 90);
  }, []);

  // Deep links: /#encode and /#decode open the section automatically.
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'encode' || hash === 'decode') openSection(hash);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [openSection]);

  return (
    <ToastProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Particles />
      <Navbar onOpen={openSection} />
      <main id="main">
        <Hero onOpen={openSection} />
        <EncodeSection open={opened.encode} onOpen={openSection} />
        <DecodeSection open={opened.decode} onOpen={openSection} />
        <HowItWorks />
        <PrivacySection />
      </main>
      <Footer onOpen={openSection} />
    </ToastProvider>
  );
}
