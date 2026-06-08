import React, { useState } from 'react';
import { Brain, Eye, EyeOff, Loader2 } from 'lucide-react';

interface Props {
  onLogin: (email: string, password: string) => Promise<unknown>;
  onRegister: (email: string, password: string, name: string) => Promise<unknown>;
}

const AuthScreen: React.FC<Props> = ({ onLogin, onRegister }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await onLogin(email.trim(), password);
      } else {
        await onRegister(email.trim(), password, name.trim());
      }
    } catch (err) {
      setError((err as Error).message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="w-[400px] h-[600px] bg-background flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-surface2 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-primary">Orvicc</h1>
            <p className="text-xs text-secondary">AI Browser Automation</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
          <Brain className="w-9 h-9 text-white" />
        </div>

        <h2 className="text-xl font-bold text-primary mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-xs text-secondary mb-6 text-center">
          {mode === 'login'
            ? 'Sign in to use Orvicc'
            : 'Sign up free — 50 automations/month included'}
        </p>

        {/* Error */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 text-xs mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="w-full bg-surface2 border border-surface rounded-lg px-3 py-2.5 text-sm text-primary placeholder-secondary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-surface2 border border-surface rounded-lg px-3 py-2.5 text-sm text-primary placeholder-secondary focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                className="w-full bg-surface2 border border-surface rounded-lg px-3 py-2.5 pr-9 text-sm text-primary placeholder-secondary focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
              >
                {showPass
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 mt-1"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Switch mode */}
        <p className="text-xs text-secondary mt-5">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={switchMode}
            className="text-accent hover:underline font-medium"
          >
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>

        {/* Footer note */}
        <p className="text-xs text-secondary mt-3 text-center opacity-60">
          Your account syncs workflows across<br />sessions and tracks usage limits.
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
