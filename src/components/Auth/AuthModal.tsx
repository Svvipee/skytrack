'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { X, Mail, Lock, User, Github, Chrome, Plane } from 'lucide-react';
import { useUIStore } from '@/store';
import { Button } from '@/components/UI/Button';
import { GlassPanel } from '@/components/UI/GlassPanel';

type Mode = 'signin' | 'signup';

export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, addToast } = useUIStore();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  const handleClose = () => {
    setAuthModalOpen(false);
    reset();
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        name: name || email.split('@')[0],
        isRegister: mode === 'signup' ? 'true' : 'false',
        redirect: false,
      });

      if (result?.error) {
        setError(
          mode === 'signup'
            ? 'Email already registered. Try signing in.'
            : 'Invalid email or password.'
        );
      } else {
        addToast({ type: 'success', message: `Welcome${name ? `, ${name}` : ''}! ✈` });
        handleClose();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    await signIn(provider, { callbackUrl: '/' });
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <GlassPanel className="w-full max-w-md p-0 overflow-hidden shadow-panel">
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/15 flex items-center justify-center">
                    <Plane className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-text)]">
                      {mode === 'signin' ? 'Welcome back' : 'Create account'}
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {mode === 'signin' ? 'Sign in to save your collections' : 'Join to track and save flights'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* OAuth Buttons */}
                {(process.env.NEXT_PUBLIC_GOOGLE_AVAILABLE === 'true' || true) && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleOAuth('google')}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--color-border)] hover:bg-white/10 transition-all text-sm text-[var(--color-text)] font-medium"
                    >
                      <Chrome className="w-4 h-4" />
                      Google
                    </button>
                    <button
                      onClick={() => handleOAuth('github')}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--color-border)] hover:bg-white/10 transition-all text-sm text-[var(--color-text)] font-medium"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--color-border)]" />
                  <span className="text-xs text-[var(--color-text-muted)]">or continue with email</span>
                  <div className="flex-1 h-px bg-[var(--color-border)]" />
                </div>

                {/* Credentials Form */}
                <form onSubmit={handleCredentials} className="space-y-3">
                  {mode === 'signup' && (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                      <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-sm"
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-sm"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all text-sm"
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg"
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button type="submit" loading={loading} className="w-full" size="md">
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Button>
                </form>

                {/* Mode Toggle */}
                <p className="text-center text-xs text-[var(--color-text-muted)]">
                  {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                    className="text-[var(--color-primary)] hover:underline font-medium"
                  >
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>

                <p className="text-center text-xs text-[var(--color-text-muted)] opacity-60">
                  Demo mode: any email + password works instantly
                </p>
              </div>
            </GlassPanel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
