import React from 'react';
import { AlertOctagon, RotateCw, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReset = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('cogava_payroll_auth_session_v3_active');
    } catch (e) {
      console.warn(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans select-none">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shadow-inner">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-stone-900">
                Đã xảy ra sự cố hiển thị
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                Hệ thống phát hiện lỗi không mong muốn trong quá trình kết xuất giao diện. 
                Dữ liệu trên Cloud Firestore và Local Storage vẫn được bảo vệ an toàn 100%.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-stone-50 rounded-xl text-left border border-stone-200 overflow-x-auto max-h-32 text-[11px] font-mono text-stone-700">
                <span className="font-bold text-rose-600">Lỗi: </span>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Tải lại trang</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReset}
                className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs border border-stone-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Khôi phục phiên làm việc"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Làm mới phiên</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
