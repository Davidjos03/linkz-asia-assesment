import { FormEvent, useState } from 'react';
import { LinkzLogo } from './LinkzLogo';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <LinkzLogo size="sm" />
      </header>

      {/* Main card */}
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 pb-8">
        <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface-card shadow-2xl shadow-black/50">
          {/* Left panel — marketing */}
          <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0a0f0d] via-[#0d1210] to-black p-10 lg:flex">
            <div className="absolute inset-0 grid-bg opacity-60" />
            <div className="absolute inset-0 glow-green" />

            <div className="relative z-10">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-linkz-green/30 bg-linkz-green/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-linkz-green">
                <span className="h-2 w-2 rounded-sm bg-linkz-green" />
                Seat Reservation
              </div>
              <h1 className="max-w-sm text-4xl font-bold leading-tight tracking-tight">
                Reserve with confidence
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
                Sign in to browse available seats, secure your spot, and complete payment — all
                in one place.
              </p>
            </div>

            <p className="relative z-10 text-xs text-muted/70">
              Demo: test@example.com / password123
            </p>
          </div>

          {/* Right panel — form */}
          <div className="flex w-full flex-col justify-center bg-surface-elevated px-8 py-10 sm:px-12 lg:w-1/2">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-8 flex flex-col items-center text-center">
                <LinkzLogo size="lg" className="mb-2" />
                <h2 className="mt-4 text-2xl font-semibold">Welcome</h2>
                <p className="mt-1 text-sm text-muted">Enter your credentials to continue</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm text-muted">
                    Email
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M22 6l-10 7L2 6" />
                      </svg>
                    </span>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-lg border border-border bg-[#0d0d0d] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-linkz-green focus:ring-1 focus:ring-linkz-green/40"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm text-muted">
                    Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </span>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-lg border border-border bg-[#0d0d0d] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-linkz-green focus:ring-1 focus:ring-linkz-green/40"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-linkz-green py-3 text-sm font-semibold text-white transition hover:bg-linkz-green-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Signing in…' : 'Continue'}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-muted">
                By clicking Continue, you agree to our{' '}
                <span className="underline underline-offset-2">Terms of Service</span> and{' '}
                <span className="underline underline-offset-2">Privacy Policy</span>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
