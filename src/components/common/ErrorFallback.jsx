import React from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function ErrorFallback({ error, resetError }) {
  const isDevelopment = import.meta.env.DEV

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 text-center mb-6">
          The application encountered an unexpected error. Please try refreshing the page.
        </p>

        {isDevelopment && (
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <h2 className="text-sm font-medium text-gray-900 mb-2">
              Development Error Details:
            </h2>
            <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-32">
              {error?.message || 'Unknown error'}
            </pre>
            {error?.stack && (
              <details className="mt-2">
                <summary className="text-xs text-gray-600 cursor-pointer">
                  Stack trace
                </summary>
                <pre className="text-xs text-gray-500 mt-1 whitespace-pre-wrap overflow-auto max-h-32">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh Page
          </button>
          
          {resetError && (
            <button
              onClick={resetError}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>

        {isDevelopment && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Common Solutions:
            </h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Check that .env file exists and has correct Supabase credentials</li>
              <li>• Restart the development server (Ctrl+C then npm run dev)</li>
              <li>• Verify all imports in the component are correct</li>
              <li>• Check browser console for additional error details</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}