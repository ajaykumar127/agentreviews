import LoginForm from '@/components/LoginForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Agentforce Agent Review</h1>
          <div className="mt-2 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-300">
              Draft / Pending Review
            </span>
          </div>
          <p className="text-gray-500 mt-2">
            High-level org metadata scan for Agentforce best practices
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <LoginForm />
        </div>

        {/* Disclaimer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-medium text-blue-900 mb-2">ℹ️ What This Tool Does:</p>
          <ul className="space-y-1 text-xs">
            <li>• Scans your org's Agentforce agent metadata and configuration</li>
            <li>• Highlights best practices that aren't being followed</li>
            <li>• Checks topics, actions, instructions, and deployment settings</li>
            <li>• <strong>Limitation:</strong> Cannot catch all edge cases or custom patterns</li>
            <li>• <strong>Use as a starting point</strong> - manual troubleshooting still required</li>
          </ul>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Your credentials are used only to establish a session and are never stored.
        </p>
      </div>
    </div>
  );
}
