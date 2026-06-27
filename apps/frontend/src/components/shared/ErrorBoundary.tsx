import React, { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  message?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // TODO: wire up to Sentry / monitoring service
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  private readonly handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    const { hasError, error } = this.state;
    const { fallback, message, children } = this.props;

    if (hasError && error !== null) {
      if (fallback) return fallback(error, this.handleReset);

      return (
        <div className={styles.container} role="alert">
          <h2 className={styles.title}>Algo deu errado</h2>
          <p className={styles.message}>
            {message ?? 'Ocorreu um erro inesperado. Tente novamente.'}
          </p>
          {process.env.NODE_ENV !== 'production' && (
            <pre className={styles.details}>{error.message}</pre>
          )}
          <button className={styles.button} onClick={this.handleReset} type="button">
            Tentar novamente
          </button>
        </div>
      );
    }

    return children;
  }
}
