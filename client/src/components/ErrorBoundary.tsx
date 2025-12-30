import React from 'react';
import { supabase } from '@/lib/supabase';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg p-6 border-l-4 border-red-500">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Application Error
                </h1>
                <p className="text-gray-600 mb-4">
                  The application encountered an error and could not load properly.
                </p>

                <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                  <h2 className="font-semibold text-sm text-gray-700 mb-2">Environment Check:</h2>
                  <ul className="text-sm space-y-1">
                    <li className={supabaseUrl ? "text-green-600" : "text-red-600"}>
                      {supabaseUrl ? "✓" : "✗"} Supabase URL: {supabaseUrl ? "Present" : "Missing"}
                    </li>
                    <li className={supabaseKey ? "text-green-600" : "text-red-600"}>
                      {supabaseKey ? "✓" : "✗"} Supabase Key: {supabaseKey ? "Present" : "Missing"}
                    </li>
                  </ul>
                </div>

                {!supabaseUrl || !supabaseKey ? (
                  <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Missing Environment Variables:</strong> Create a <code className="bg-yellow-100 px-1 rounded">.env</code> file in the client directory with:
                    </p>
                    <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded overflow-x-auto">
{`VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key`}
                    </pre>
                  </div>
                ) : null}

                {isDev && this.state.error ? (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                      Error Details (Dev Only)
                    </summary>
                    <div className="mt-2 p-3 bg-red-50 rounded border border-red-200">
                      <p className="text-sm font-mono text-red-800 mb-2">
                        {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo?.componentStack && (
                        <pre className="text-xs text-red-700 overflow-x-auto whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                ) : null}

                <button
                  onClick={() => window.location.reload()}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Reload Application
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
