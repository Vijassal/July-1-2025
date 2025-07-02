'use client';

import { Lock, AlertTriangle } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You need a valid invitation link to access this scheduling tool.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-yellow-800 mb-1">
                Invalid or Missing Token
              </h3>
              <p className="text-sm text-yellow-700">
                This scheduling tool requires a valid JWT token to access. Please use the link provided in your invitation email.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact the event organizer.
          </p>
          
          <button
            onClick={() => window.close()}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close Window
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Scheduler Tool v1.0 • Secure Booking System
          </p>
        </div>
      </div>
    </div>
  );
} 