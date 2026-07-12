import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Keep error reporting centralized here when a production telemetry service is added.
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return <main className="app-error-state">
      <span className="empty-glyph">!</span>
      <p className="eyebrow">UNEXPECTED ERROR</p>
      <h1>EcoSphere needs a quick refresh.</h1>
      <p>Your saved demo data is still stored locally. Refresh to return to the workspace.</p>
      <Button onClick={() => window.location.reload()}>Refresh EcoSphere</Button>
    </main>;
  }
}
