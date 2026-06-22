import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props  { children: ReactNode; }
interface State  { hasError: boolean; error: Error | null; }

/**
 * Catches unhandled React render errors and shows a friendly recovery screen
 * instead of a blank white page. Wrap around <App /> in main.tsx.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body items-center text-center gap-4">
            <div className="text-6xl">⚠️</div>
            <h1 className="card-title text-2xl font-serif text-error">
              Ceva a mers greșit
            </h1>
            <p className="text-base-content/70 text-sm">
              A apărut o eroare neașteptată. Încearcă să reîncarci pagina.
            </p>
            {this.state.error && (
              <details className="w-full text-left">
                <summary className="text-xs text-base-content/40 cursor-pointer">
                  Detalii tehnice
                </summary>
                <pre className="text-xs bg-base-200 rounded-lg p-3 mt-2 overflow-auto max-h-32 text-error/70">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 w-full mt-2">
              <button
                className="btn btn-outline flex-1"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Încearcă din nou
              </button>
              <button
                className="btn btn-primary text-white flex-1"
                onClick={() => { window.location.href = "/"; }}
              >
                Acasă
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;