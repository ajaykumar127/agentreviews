import LoginForm from '@/components/LoginForm';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#0c0e14] dark:to-slate-900 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle size="sm" />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4 shadow-lg">
            <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Robot/Agent Head */}
              <rect x="6" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="9.5" cy="8" r="1" fill="currentColor"/>
              <circle cx="14.5" cy="8" r="1" fill="currentColor"/>
              <path d="M9 11.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="10" y="2" width="4" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M6 9h-1.5M18 9h1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Magnifying Glass/Lens */}
              <circle cx="16.5" cy="16.5" r="3.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
              <path d="M19 19l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agentforce Agent Review Toolkit ⚡</h1>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
            by Ajay Kumar Kambadkone Suresh
          </p>
          <p className="text-gray-500 dark:text-gray-400 mt-3">
            High-level org metadata scan for Agentforce best practices
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800/80 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <LoginForm />
        </div>

        {/* About the Tool */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/90 border-2 border-blue-200 dark:border-gray-600 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 dark:text-blue-200 text-sm mb-1">About This Toolkit</h3>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                Comprehensive X-ray analysis of your Agentforce agents using industry best practices and Salesforce recommendations.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 ml-11">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-gray-700 dark:text-gray-300">Scans agent metadata, topics, actions, guardrails, and deployment settings</p>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-gray-700 dark:text-gray-300">Identifies critical issues, warnings, and improvement opportunities</p>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-gray-700 dark:text-gray-300">Provides actionable recommendations with severity-based prioritization</p>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-gray-700 dark:text-gray-300">Exports detailed PDF and JSON reports for documentation and sharing</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                <strong className="text-amber-800 dark:text-amber-300">Note:</strong> Use as a comprehensive starting point. Custom patterns and edge cases may require manual review.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Your credentials are encrypted and used only for session authentication. Never stored.
          </p>
        </div>
      </div>
    </div>
  );
}
