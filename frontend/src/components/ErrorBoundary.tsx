import { Component, ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message || 'Something went wrong' };
  }

  componentDidCatch(error: any) {
    try {
      // @ts-ignore
      window.dispatchEvent(new CustomEvent('app:error', { detail: { message: error?.message || 'Something went wrong' } }));
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: 12, border: '1px solid #ef4444', background: '#fef2f2', color: '#991b1b', borderRadius: 6 }}>
          {this.state.message}
        </div>
      );
    }
    return this.props.children;
  }
}


