import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import './styles/base.css';
import './styles/components.css';
import './styles/panels.css';
import './styles/overlays.css';
import './styles/layout.css';
import './styles/sections.css';
import './styles/animations.css';
import './styles/mobile.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
