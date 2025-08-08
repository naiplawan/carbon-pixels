'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import Link from 'next/link';
import { AppError, ErrorBoundaryState } from '@/types/waste';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to show error UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error details
    this.logError(error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo
    });
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const appError: AppError = {
      code: 'COMPONENT_ERROR',
      message: error.message,
      userMessage: 'Something went wrong in the waste diary application',
      context: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      },
      timestamp: new Date()
    };

    // In a real app, send this to error logging service
    console.error('Logged App Error:', appError);
    
    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      existingErrors.push(appError);
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      localStorage.setItem('app_errors', JSON.stringify(existingErrors));
    } catch (e) {
      console.warn('Could not store error in localStorage:', e);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private getErrorType = (error: Error): string => {
    if (error.message.includes('localStorage')) return 'STORAGE_ERROR';
    if (error.message.includes('fetch') || error.message.includes('network')) return 'NETWORK_ERROR';
    if (error.message.includes('JSON')) return 'DATA_ERROR';
    if (error.message.includes('Cannot read properties')) return 'REFERENCE_ERROR';
    return 'UNKNOWN_ERROR';
  };

  private getErrorSuggestions = (error: Error): string[] => {
    const errorType = this.getErrorType(error);
    
    switch (errorType) {
      case 'STORAGE_ERROR':
        return [
          'Your browser storage might be full',
          'Try clearing your browser data',
          'Enable local storage in privacy settings'
        ];
      case 'NETWORK_ERROR':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'The service might be temporarily unavailable'
        ];
      case 'DATA_ERROR':
        return [
          'Your saved data might be corrupted',
          'Try clearing the app data and starting fresh',
          'Contact support if this persists'
        ];
      case 'REFERENCE_ERROR':
        return [
          'A component couldn\'t load properly',
          'Try refreshing the page',
          'This might be a temporary issue'
        ];
      default:
        return [
          'Try refreshing the page',
          'Clear your browser cache',
          'Contact support if the problem persists'
        ];
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const errorType = error ? this.getErrorType(error) : 'UNKNOWN_ERROR';
      const suggestions = error ? this.getErrorSuggestions(error) : [];

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg border-2 border-red-200 p-6">
            {/* Error icon and title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="font-handwritten text-2xl text-red-700 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 text-sm">
                Your waste diary encountered an unexpected error
              </p>
            </div>

            {/* Error type badge */}
            <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-red-600 uppercase tracking-wide">
                  Error Type: {errorType.replace('_', ' ')}
                </span>
                <Bug className="w-4 h-4 text-red-500" />
              </div>
              
              {error && (
                <div className="text-sm text-red-700 font-mono bg-red-50 rounded px-2 py-1 break-words">
                  {error.message}
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="mb-6">
              <h3 className="font-handwritten text-lg text-gray-700 mb-3">
                What you can try:
              </h3>
              <ul className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-handwritten rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-handwritten rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </button>
            </div>

            {/* Navigation */}
            <div className="text-center">
              <Link 
                href="/"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm"
              >
                <Home className="w-4 h-4 mr-1" />
                Back to Home
              </Link>
            </div>

            {/* Technical details (expandable) */}
            {this.props.showDetails && error && (
              <details className="mt-6 border-t border-gray-200 pt-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Technical Details (for developers)
                </summary>
                <div className="mt-2 bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-mono text-gray-600 whitespace-pre-wrap break-words">
                    <strong>Error:</strong> {error.message}
                    {error.stack && (
                      <>
                        <br /><br />
                        <strong>Stack Trace:</strong>
                        <br />
                        {error.stack}
                      </>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <br /><br />
                        <strong>Component Stack:</strong>
                        <br />
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </div>
                </div>
              </details>
            )}

            {/* Support link */}
            <div className="mt-4 text-center text-xs text-gray-400">
              Need help? Contact{' '}
              <a 
                href="mailto:support@thailand-waste-diary.com" 
                className="text-blue-500 hover:text-blue-700 underline"
              >
                support@thailand-waste-diary.com
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors in components
export function useErrorHandler() {
  const handleError = (error: Error, context?: Record<string, any>) => {
    const appError: AppError = {
      code: 'ASYNC_ERROR',
      message: error.message,
      userMessage: 'An error occurred while processing your request',
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        stack: error.stack
      },
      timestamp: new Date()
    };

    console.error('Async Error:', appError);
    
    // In a real app, send to error logging service
    // You could also show a toast notification here
  };

  return { handleError };
}

// Specific error boundaries for different parts of the app
export function WasteDiaryErrorBoundary({ children }: { children: ReactNode }) {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Custom logging for waste diary specific errors
    console.error('Waste Diary Error:', error, errorInfo);
  };

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 m-4 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="font-handwritten text-xl text-yellow-700 mb-2">
            Diary Temporarily Unavailable
          </h2>
          <p className="text-yellow-600 mb-4">
            Your waste diary encountered an issue, but your data is safe!
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-handwritten"
          >
            Refresh Diary
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function ScannerErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">📷</div>
          <h2 className="font-handwritten text-xl text-blue-700 mb-2">
            Scanner Not Available
          </h2>
          <p className="text-blue-600 mb-4">
            The AI scanner is having issues. You can still add items manually!
          </p>
          <Link 
            href="/diary/manual"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-handwritten inline-block"
          >
            Use Manual Entry
          </Link>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}