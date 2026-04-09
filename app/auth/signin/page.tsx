'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'manager' | 'analyst' | 'designer'>('analyst');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    const errorMessages: Record<string, string> = {
      NoUser: 'Email not registered. Please sign up first.',
      NoPassword: 'This account has no password. Use OAuth or register again.',
      WrongPassword: 'Invalid password. Please try again.',
      GoogleNotRegistered: 'Google account not registered. Please register first.',
      CredentialsSignin: 'Sign in failed. Check your credentials or register first.',
      AccessDenied: 'Access denied. Please sign in with a registered account.',
    };

    if (error) {
      setErrorMessage(errorMessages[error] || decodeURIComponent(error));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    if (isSignUp) {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, role }),
      });

      if (res.ok) {
        const result = await signIn('credentials', { email, password, redirect: false });
        if (result?.ok) {
          router.push('/dashboard');
        } else {
          setErrorMessage('Signup succeeded, but login failed. Please sign in manually.');
        }
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Sign up failed. Please try again.');
      }
    } else {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.ok) {
        router.push('/dashboard');
      } else {
        setErrorMessage('Sign in failed. Check your email and password.');
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleForgotPassword = () => {
    alert('Forgot password feature coming soon! Please contact support.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/2 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-pink-500/15 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="mb-8">
              <span className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-white shadow-sm">
                Async Copilot
              </span>
              <h1 className="mt-6 text-5xl font-semibold leading-tight text-white sm:text-6xl">
                Sign in to your hub.
              </h1>
              <p className="mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
                Seamless async collaboration with manager, analyst, and designer workflows.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Feature</p>
                <p className="mt-3 text-lg font-semibold text-white">Role-based dashboards</p>
                <p className="mt-2 text-sm text-slate-300">Switch between manager, analyst, and designer views instantly.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Ready</p>
                <p className="mt-3 text-lg font-semibold text-white">Interactive routing</p>
                <p className="mt-2 text-sm text-slate-300">Fast login, role selection, and dashboard navigation.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="mb-6">
              <h2 className="text-3xl font-semibold">{isSignUp ? 'Create your account' : 'Sign in to continue'}</h2>
              <p className="text-sm text-slate-400">Secure access for your async collaboration workspace.</p>
            </div>

            {errorMessage && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                {errorMessage}
              </div>
            )}

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {isSignUp && (
                  <>
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-slate-200">
                        Username
                      </label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                        placeholder="Your display name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-200 mb-3">Choose your role</p>
                      <div className="grid grid-cols-3 gap-3">
                        {['manager', 'analyst', 'designer'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setRole(option as 'manager' | 'analyst' | 'designer')}
                            className={`rounded-3xl border px-4 py-3 text-sm font-semibold transition ${role === option ? 'border-indigo-500 bg-indigo-600 text-white shadow' : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-indigo-500 hover:bg-slate-900'}`}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-400">
                <button type="button" onClick={handleForgotPassword} className="hover:text-white transition">
                  Forgot your password?
                </button>
                <span className="font-medium">{isSignUp ? 'Signing up' : 'Signing in'}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Processing...' : isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 relative">
              <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700" />
              <div className="relative mx-auto w-fit bg-slate-950 px-3 text-sm text-slate-400">Or continue with</div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-500 hover:bg-slate-900"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="mt-6 text-center text-sm text-slate-400">
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-white hover:text-indigo-300">
                {isSignUp ? 'Already have an account? Sign in' : 'New to Async Copilot? Create account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}