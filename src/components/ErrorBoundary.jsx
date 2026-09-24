import { Component, StrictMode } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // The fallback below keeps the page usable without exposing stack traces.
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="fatal glass" role="alert">
          <h1>Emoji Code</h1>
          <p>Something went wrong while rendering the page.</p>
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
