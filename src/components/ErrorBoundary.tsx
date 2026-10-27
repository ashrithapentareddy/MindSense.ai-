import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('MindSense AI render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-ink-950 flex items-center justify-center p-8">
          <div className="max-w-md rounded-2xl glass-card p-8 text-center">
            <h1 className="text-xl font-bold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-400 mb-4">
              The application encountered an unexpected error. This does not affect
              your data.
            </p>
            <pre className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 overflow-auto text-left max-h-32">
              {this.state.error?.message ?? 'Unknown error'}
            </pre>
            <button
              onClick={this.handleReset}
              className="rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-5 py-2 text-sm font-semibold text-white shadow-glow-sm hover:shadow-glow transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
