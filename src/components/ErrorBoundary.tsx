import React from 'react';

interface Props {
  children: React.ReactNode;
  /** When this value changes (another tab, for example), the area tries to draw again. */
  resetKey?: unknown;
  /** Whole page: offer a reload, since nothing else is left on screen. */
  fullPage?: boolean;
}

interface State {
  error: Error | null;
}

/**
 * A drawing error in one area shows a notice there instead of blanking the whole app.
 * Nothing is written to the cloud from here, so the library is never touched.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  // The project has no React type definitions installed, so the inherited members are declared here.
  declare readonly props: Readonly<Props>;
  declare setState: (state: State) => void;
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erro ao exibir esta parte do app:', error, info.componentStack);
  }

  componentDidUpdate(previous: Props) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className={this.props.fullPage ? 'min-h-screen bg-stone-950 flex items-center justify-center p-4' : 'py-6'}>
        <div role="alert" className="mx-auto max-w-lg rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm text-amber-200 space-y-3">
          <p className="font-semibold">Esta parte do app encontrou um erro e não pôde ser exibida.</p>
          <p className="text-xs opacity-90">Seus dados não foram alterados. Tente de novo; se o erro voltar, recarregue a página.</p>
          <p className="font-mono text-[11px] opacity-70 break-words">{this.state.error.message}</p>
          <div className="flex gap-2">
            {!this.props.fullPage && (
              <button
                type="button"
                onClick={() => this.setState({ error: null })}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-on-accent cursor-pointer"
              >
                Tentar de novo
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              Recarregar página
            </button>
          </div>
        </div>
      </div>
    );
  }
}
