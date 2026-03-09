'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type EnvOption = 'production' | 'sandbox' | 'custom';
type LoginMethod = 'oauth' | 'direct';

export default function LoginForm() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('direct');
  const [envOption, setEnvOption] = useState<EnvOption>('custom');
  const [customUrl, setCustomUrl] = useState('https://pronto3-dev-ed.develop.my.salesforce.com');

  // Direct login fields
  const [directLoginUrl, setDirectLoginUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityToken, setSecurityToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getLoginUrl = () => {
    if (envOption === 'production') return 'https://login.salesforce.com';
    if (envOption === 'sandbox') return 'https://test.salesforce.com';
    return customUrl;
  };

  const handleOAuthLogin = () => {
    // Redirect to our authorize endpoint which redirects to Salesforce's login page
    const loginUrl = encodeURIComponent(getLoginUrl());
    window.location.href = `/api/auth/authorize?loginUrl=${loginUrl}`;
  };

  const handleDirectLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/direct-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginUrl: directLoginUrl,
          username,
          password: password + securityToken, // Salesforce requires password + security token
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Login failed:', data);
        setError(data.error || 'Login failed');
        return;
      }

      console.log('Login successful, redirecting to dashboard');
      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err) {
      console.error('Login exception:', err);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Login Method Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setLoginMethod('oauth')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
            loginMethod === 'oauth'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          OAuth Login
        </button>
        <button
          onClick={() => setLoginMethod('direct')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
            loginMethod === 'direct'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Direct Login
        </button>
      </div>

      {/* OAuth Login */}
      {loginMethod === 'oauth' && (
        <>
          {/* OAuth Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-amber-800">
              <strong>⚠️ OAuth Setup Required:</strong> OAuth requires a custom Salesforce Connected App.
              Use Direct Login for now, or contact admin to set up OAuth with the callback URL:
              <code className="block mt-1 text-xs bg-white px-2 py-1 rounded">
                https://agentreview-74953dba67a9-131c6398b543.herokuapp.com/OauthRedirect
              </code>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Environment
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="env"
                  checked={envOption === 'production'}
                  onChange={() => setEnvOption('production')}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">Production</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="env"
                  checked={envOption === 'sandbox'}
                  onChange={() => setEnvOption('sandbox')}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">Sandbox</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="env"
                  checked={envOption === 'custom'}
                  onChange={() => setEnvOption('custom')}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">Custom Domain</span>
              </label>
            </div>
            {envOption === 'custom' && (
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://your-domain.my.salesforce.com"
                className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-sm"
              />
            )}
          </div>

          <button
            onClick={handleOAuthLogin}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            Login with Salesforce OAuth
          </button>

          <p className="text-xs text-gray-500 text-center">
            You&apos;ll be redirected to Salesforce&apos;s login page to authenticate securely.
          </p>
        </>
      )}

      {/* Direct Login */}
      {loginMethod === 'direct' && (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salesforce URL
              </label>
              <input
                type="url"
                value={directLoginUrl}
                onChange={(e) => setDirectLoginUrl(e.target.value)}
                placeholder="https://storm-f4e8ebcbe3cc7a.lightning.force.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Can be Lightning URL (.lightning.force.com) or My Domain URL (.my.salesforce.com)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your.email@company.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Token (optional)
              </label>
              <input
                type="password"
                value={securityToken}
                onChange={(e) => setSecurityToken(e.target.value)}
                placeholder="Leave blank if IP is whitelisted"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleDirectLogin}
            disabled={loading || !directLoginUrl || !username || !password}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login with Credentials
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Your credentials are encrypted and used only for this session.
          </p>
        </>
      )}
    </div>
  );
}
