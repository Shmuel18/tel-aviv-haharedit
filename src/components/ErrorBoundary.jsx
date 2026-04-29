import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary:${this.props.label || 'unknown'}]`, error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-mark">⚠</div>
          <div className="error-boundary-body">
            <strong>{this.props.title || 'מקטע זה נפל זמנית'}</strong>
            <p>{this.props.message || 'השאר את האתר ממשיך לעבוד. נסה לרענן את הדף.'}</p>
            {import.meta.env.DEV && (
              <pre className="error-boundary-detail">{String(this.state.error?.message || this.state.error)}</pre>
            )}
            <button
              className="error-boundary-retry"
              onClick={() => this.setState({ error: null })}
            >
              נסה שוב
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
