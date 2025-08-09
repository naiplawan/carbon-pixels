'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, send to error reporting service like Sentry
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // Store locally for now
    const existingErrors = JSON.parse(localStorage.getItem('app-errors') || '[]');
    existingErrors.push(errorData);
    localStorage.setItem('app-errors', JSON.stringify(existingErrors.slice(-10))); // Keep last 10 errors
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/diary';
  };

  handleReportError = () => {
    const { error, errorId } = this.state;
    const subject = encodeURIComponent(`Thailand Waste Diary Error Report - ${errorId}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error: ${error?.message}
URL: ${window.location.href}
Time: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Your description here]

Additional details:
- Browser: ${navigator.userAgent}
- Screen size: ${window.innerWidth}x${window.innerHeight}
    `);
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-handwritten text-red-800 mb-2">
              โอ๊ะ! เกิดข้อผิดพลาด<br/>Oops! Something went wrong
            </h1>

            {/* Error Description */}
            <div className="text-gray-600 mb-6 space-y-2">
              <p className="text-sm">
                เราไม่สามารถโหลดหน้านี้ได้ในขณะนี้<br/>
                We couldn&apos;t load this page right now.
              </p>
              <p className="text-xs text-gray-500">
                ข้อมูลของคุณยังปลอดภัย - ไม่มีข้อมูลสูญหาย<br/>
                Your data is safe - nothing was lost.
              </p>
            </div>

            {/* Error ID */}
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-xs text-gray-600 mb-1">Error ID สำหรับการแจ้งปัญหา:</p>
              <code className="text-xs font-mono text-gray-800 break-all">
                {this.state.errorId}
              </code>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                ลองใหม่ / Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                กลับหน้าหลัก / Go Home
              </button>

              <button
                onClick={this.handleReportError}
                className="w-full flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                แจ้งปัญหา / Report Error
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-xs text-gray-500 space-y-1">
              <p>💡 เทคนิคการแก้ไข:</p>
              <ul className="text-left list-disc list-inside space-y-0.5">
                <li>รีเฟรชหน้าเว็บ (F5 หรือ Ctrl+R)</li>
                <li>ลองใช้งานในโหมด Incognito</li>
                <li>ตรวจสอบการเชื่อมต่ออินเตอร์เน็ต</li>
                <li>ล้าง Cache ของเบราว์เซอร์</li>
              </ul>
            </div>

            {/* Thailand Context */}
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-800">
                🇹🇭 ขณะนี้ยังคงสนับสนุนเป้าหมายคาร์บอนนิวทรัลของไทยใน 2050<br/>
                <span className="text-green-600">
                  Still supporting Thailand&apos;s 2050 carbon neutrality goal
                </span>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook for using error boundary programmatically
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // This would trigger the error boundary
    throw error;
  };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Specific error components for common scenarios
export function DataLoadError({ onRetry, message }: { onRetry: () => void; message?: string }) {
  return (
    <div className="text-center p-6 bg-amber-50 rounded-lg border border-amber-200">
      <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
      <h3 className="font-medium text-amber-800 mb-2">ไม่สามารถโหลดข้อมูลได้</h3>
      <p className="text-sm text-amber-700 mb-4">
        {message || 'เกิดปัญหาในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง'}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      >
        <RefreshCw className="w-4 h-4 inline mr-2" />
        ลองใหม่
      </button>
    </div>
  );
}

export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
      <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
      <h3 className="font-medium text-red-800 mb-2">ปัญหาการเชื่อมต่อ</h3>
      <p className="text-sm text-red-700 mb-4">
        ไม่สามารถเชื่อมต่ออินเตอร์เน็ตได้ กรุณาตรวจสอบการเชื่อมต่อ
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        <RefreshCw className="w-4 h-4 inline mr-2" />
        ลองเชื่อมต่อใหม่
      </button>
    </div>
  );
}