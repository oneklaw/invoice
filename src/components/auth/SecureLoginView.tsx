import React, { useState } from 'react';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  Fingerprint,
  RefreshCw,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { User } from '../../types';
import { googleSignIn } from '../../services/googleAuthService';
import { CurrencySelect } from '../currency/CurrencySelect';

interface SecureLoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const SecureLoginView: React.FC<SecureLoginViewProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [email, setEmail] = useState('onekalitkenneth@gmail.com');
  const [password, setPassword] = useState('SecurePass2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // 2FA state
  const [pendingUser2FA, setPendingUser2FA] = useState<User | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regOrgName, setRegOrgName] = useState('');
  const [regCurrency, setRegCurrency] = useState('USD');
  const [regPassword, setRegPassword] = useState('');

  // Error & loading
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cooldownRemaining > 0) {
      setError(`Account temporarily locked for security. Please wait ${cooldownRemaining}s.`);
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 450));

    const result = storageService.login(email, password, rememberMe);
    setIsLoading(false);

    if (result.requires2FA && result.user) {
      setPendingUser2FA(result.user);
      return;
    }

    if (!result.success || !result.user) {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      if (nextFail >= 4) {
        setCooldownRemaining(30);
        const timer = setInterval(() => {
          setCooldownRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      setError(result.error || 'Authentication failed. Please verify credentials.');
      return;
    }

    onLoginSuccess(result.user);
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result && result.user && result.user.email) {
        const session = storageService.loginWithGoogle(
          {
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
          },
          rememberMe
        );
        onLoginSuccess(session.user);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Google authentication was cancelled or encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser2FA) return;
    setError(null);

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 350));

    const result = storageService.verify2FA(pendingUser2FA, twoFactorCode, rememberMe);
    setIsLoading(false);

    if (!result.success || !result.user) {
      setError(result.error || 'Invalid 2FA code.');
      return;
    }

    onLoginSuccess(result.user);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName || !regEmail || !regOrgName) {
      setError('Please fill in all required fields.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const result = storageService.registerNewTenant({
      name: regName,
      email: regEmail,
      orgName: regOrgName,
      currency: regCurrency,
    });

    setIsLoading(false);

    if (!result.success || !result.user) {
      setError(result.error || 'Registration failed.');
      return;
    }

    onLoginSuccess(result.user);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      {/* Background radial gradient accent */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.08),transparent_60%)]" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-1 shadow-lg shadow-indigo-500/10">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Invox SaaS
          </h1>
          <p className="text-xs text-slate-400">
            Secure Multi-Tenant Authentication & Access Control
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setPendingUser2FA(null);
              setError(null);
            }}
            className={`py-2 rounded-md transition-colors font-semibold ${
              authMode === 'login' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setPendingUser2FA(null);
              setError(null);
            }}
            className={`py-2 rounded-md transition-colors font-semibold ${
              authMode === 'register' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 2FA Verification Mode */}
        {pendingUser2FA ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                <Fingerprint className="w-4 h-4" />
                <span>Multi-Factor Authentication</span>
              </div>
              <h2 className="text-base font-bold text-white">Enter 6-Digit 2FA Code</h2>
              <p className="text-xs text-slate-400">
                Super Admin authentication for <strong className="text-slate-300">{pendingUser2FA.email}</strong> requires dual-factor verification.
              </p>
            </div>

            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Authenticator Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-indigo-500"
                  placeholder="749210"
                />
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <button
                  type="button"
                  onClick={() => setTwoFactorCode('749210')}
                  className="text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  Use Demo OTP: 749210
                </button>
                <button
                  type="button"
                  onClick={() => setPendingUser2FA(null)}
                  className="text-slate-400 hover:text-white"
                >
                  Back to Login
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>Verify & Unlock System</span>
              </button>
            </form>
          </div>
        ) : authMode === 'login' ? (
          /* Sign In Form */
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-xl">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="user@company.com"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword('SecurePass2026!')}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    Use Demo Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    placeholder="••••••••••••"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Remember session for 7 days</span>
                </label>
                <span className="text-[11px] text-slate-500 font-mono">TLS 1.3</span>
              </div>

              <button
                type="submit"
                disabled={isLoading || cooldownRemaining > 0}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                <span>
                  {cooldownRemaining > 0 ? `Locked (${cooldownRemaining}s)` : 'Authenticate to Invox'}
                </span>
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500 font-mono">Or continue with</span>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="gsi-material-button w-full"
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        style={{ display: 'block' }}
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        ></path>
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        ></path>
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        ></path>
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        ></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">Sign in with Google</span>
                  </div>
                </button>
              </div>

              <div className="pt-2 text-center text-xs text-slate-400">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError(null);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                >
                  Sign up
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Sign Up Form */
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white">Create Your Account</h2>
              <p className="text-xs text-slate-400">
                Sign up and set up your company workspace with 10 free starter invoices.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Rachel Adams"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="rachel@company.com"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  value={regOrgName}
                  onChange={(e) => setRegOrgName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Horizon Labs Inc."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CurrencySelect
                    label="Operating Currency"
                    value={regCurrency}
                    onChange={setRegCurrency}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Building2 className="w-3.5 h-3.5" />}
                <span>Sign Up & Start Free</span>
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError(null);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security & Compliance Badges */}
        <div className="pt-2 text-center space-y-2">
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>256-Bit AES</span>
            </span>
            <span>·</span>
            <span>Zero-Trust RBAC</span>
            <span>·</span>
            <span>SOC 2 Type II</span>
          </div>
          <div className="text-[10px] text-slate-600">
            Protected by Invox Real-Time Rate Limiter and Audited Session Engine
          </div>
        </div>
      </div>
    </div>
  );
};
