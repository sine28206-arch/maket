import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">화면을 불러오는 중 문제가 발생했습니다</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              일시적인 데이터 처리 오류일 수 있습니다. 아래 버튼을 눌러 다시 시도해 주세요.
            </p>
            {this.state.error && (
              <p className="text-[11px] font-mono text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 text-left overflow-x-auto">
                {this.state.error.message}
              </p>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>다시 시도</span>
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2.5 rounded-xl bg-[#0E9F98] hover:bg-[#0c857f] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>새로고침</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
