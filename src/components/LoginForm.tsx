'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Save, Database } from 'lucide-react';

type EnvOption = 'production' | 'sandbox' | 'custom';
type LoginMethod = 'oauth' | 'direct';

interface SavedCredential {
  id: string;
  profileName: string;
  loginUrl: string;
  username: string;
  authMethod: 'oauth' | 'direct';
  lastUsed: Date | null;
}

export default function LoginForm() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('direct');
  const [showOAuth, setShowOAuth] = useState(false);
  const [envOption, setEnvOption] = useState<EnvOption>('custom');
  const [customUrl, setCustomUrl] = useState('https://pronto3-dev-ed.develop.my.salesforce.com');

  // Direct login fields (primary – no OAuth/Connected App required)
  const [directLoginUrl, setDirectLoginUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityToken, setSecurityToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Credential management
  const [savedCredentials, setSavedCredentials] = useState<SavedCredential[]>([]);
  const [selectedCredentialId, setSelectedCredentialId] = useState<string>('');
  const [saveCredential, setSaveCredential] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [loadingCredentials, setLoadingCredentials] = useState(true);

  // Fetch saved credentials on mount
  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await fetch('/api/credentials');
      const data = await res.json();
      if (data.success) {
        setSavedCredentials(data.credentials);
      }
    } catch (err) {
      console.error('Failed to fetch credentials:', err);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleCredentialSelect = async (credId: string) => {
    if (!credId) {
      setSelectedCredentialId('');
      return;
    }

    setSelectedCredentialId(credId);
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/credentials/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: credId }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.replace('/dashboard');
      } else {
        setError(data.error || 'Authentication failed');
        setSelectedCredentialId('');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Failed to authenticate with saved credential');
      setSelectedCredentialId('');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCredential = async (credId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this saved credential?')) {
      return;
    }

    try {
      const res = await fetch('/api/credentials/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: credId }),
      });

      if (res.ok) {
        fetchCredentials(); // Refresh list
      }
    } catch (err) {
      console.error('Failed to delete credential:', err);
    }
  };

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

      console.log('Login successful');

      // Save credential if requested
      if (saveCredential && profileName) {
        try {
          await fetch('/api/credentials/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profileName,
              loginUrl: directLoginUrl,
              username,
              password,
              securityToken: securityToken || null,
              authMethod: 'direct',
            }),
          });
          console.log('Credential saved successfully');
        } catch (saveErr) {
          console.error('Failed to save credential:', saveErr);
          // Don't block login on save failure
        }
      }

      // Go to dashboard; scan runs automatically
      window.location.replace('/dashboard');
    } catch (err) {
      console.error('Login exception:', err);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Primary: Username / password login – no OAuth or production rights needed */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/90 border-2 border-blue-200 dark:border-gray-600 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Log in to your Salesforce org</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          Use your org URL and credentials. After login, the Agentforce scan will start automatically.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Login URL (org)
            </label>
            <input
              type="url"
              value={directLoginUrl}
              onChange={(e) => setDirectLoginUrl(e.target.value)}
              placeholder="https://your-org.my.salesforce.com or https://your-org.lightning.force.com"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              My Domain (.my.salesforce.com) or Lightning (.lightning.force.com) URL
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your.email@company.com"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Security token <span className="text-gray-500 dark:text-gray-400 font-normal">(if required)</span>
            </label>
            <input
              type="password"
              value={securityToken}
              onChange={(e) => setSecurityToken(e.target.value)}
              placeholder="Append to password if IP not whitelisted"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Setup → My Personal Information → Reset My Security Token
            </p>
          </div>

          {/* Save credential */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={saveCredential}
                onChange={(e) => setSaveCredential(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 group-hover:text-purple-600 transition">
                <Save className="w-4 h-4" />
                <span className="font-medium">Remember this credential for quick login</span>
              </div>
            </label>
            {saveCredential && (
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Profile name (e.g. Dev Sandbox)"
                className="w-full mt-2 px-4 py-2.5 border-2 border-purple-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition text-sm"
              />
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleDirectLogin}
          disabled={loading || !directLoginUrl || !username || !password}
          className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Logging in & starting scan…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Log in and run Agentforce scan
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
          Credentials are used only for this session and are not stored unless you check &quot;Remember&quot;.
        </p>
      </div>

      {/* Saved credentials (optional) */}
      {!loadingCredentials && savedCredentials.length > 0 && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-[#0c0e14] text-gray-500 dark:text-gray-400 font-medium">Or use a saved credential</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800/90 border-2 border-purple-200 dark:border-gray-600 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Quick login</h3>
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                {savedCredentials.length} saved
              </span>
            </div>
            <select
              value={selectedCredentialId}
              onChange={(e) => handleCredentialSelect(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-purple-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition text-sm font-medium disabled:opacity-50"
            >
              <option value="">-- Select a saved credential --</option>
              {savedCredentials.map((cred) => (
                <option key={cred.id} value={cred.id}>
                  {cred.profileName} ({cred.username}) – {cred.loginUrl.includes('test') ? 'Sandbox' : cred.loginUrl.includes('login.salesforce') ? 'Production' : 'Custom'}
                </option>
              ))}
            </select>
            <div className="mt-3 space-y-1">
              {savedCredentials.slice(0, 3).map((cred) => (
                <div
                  key={cred.id}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-700/50 rounded-lg border border-purple-100 dark:border-gray-600 transition group"
                >
                  <button
                    onClick={() => handleCredentialSelect(cred.id)}
                    disabled={loading}
                    className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition disabled:opacity-50"
                  >
                    <div className="font-medium">{cred.profileName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{cred.username}</div>
                  </button>
                  <button
                    onClick={(e) => handleDeleteCredential(cred.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition opacity-0 group-hover:opacity-100"
                    title="Delete credential"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-3 text-center">Saved credentials are encrypted.</p>
          </div>
        </>
      )}

      {/* OAuth as optional (requires Connected App) */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowOAuth(!showOAuth)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline transition"
        >
          {showOAuth ? '▲ Hide' : '▼ Alternative:'} OAuth (requires Connected App / production setup)
        </button>
      </div>
      {showOAuth && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-800/80 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">OAuth login</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Requires a Salesforce Connected App and callback URL. Use the form above if you don’t have production rights.
          </p>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Environment</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="env" checked={envOption === 'production'} onChange={() => setEnvOption('production')} className="text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Production</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="env" checked={envOption === 'sandbox'} onChange={() => setEnvOption('sandbox')} className="text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Sandbox</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="env" checked={envOption === 'custom'} onChange={() => setEnvOption('custom')} className="text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Custom</span>
              </label>
            </div>
            {envOption === 'custom' && (
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://your-domain.my.salesforce.com"
                className="w-full mt-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-gray-900 text-sm"
              />
            )}
          </div>
          <button
            onClick={handleOAuthLogin}
            disabled={loading}
            className="w-full py-3 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
          >
            Login with Salesforce (OAuth)
          </button>
        </div>
      )}
    </div>
  );
}
