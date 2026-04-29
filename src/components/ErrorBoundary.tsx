import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  label?: string;
  title?: string;
  message?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary:${this.props.label || 'unknown'}]`, error, info);
  }

  render(): ReactNode {
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
