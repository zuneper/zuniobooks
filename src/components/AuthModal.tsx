import React, { useState } from 'react';
import { X, Shield, Sparkles, User as UserIcon, Lock, Mail } from 'lucide-react';
import { api } from '../lib/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [userDetected, setUserDetected] = useState<boolean | null>(null);
  const [checkingUser, setCheckingUser] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto detect if user exists when identifier changes
  const handleIdentifierChange = async (val: string) => {
    setIdentifier(val);
    setError(null);
    if (!val.trim()) {
      setUserDetected(null);
      return;
    }

    setCheckingUser(true);
    try {
      const res = await api.checkUserExist(val.trim());
      setUserDetected(res.exists);
      if (res.exists) {
        setMode('login');
        if (res.username) setUsername(res.username);
      } else {
        setMode('register');
        if (!val.includes('@')) {
          setUsername(val.trim());
        } else {
          setEmail(val.trim());
        }
      }
    } catch {
      // ignore detection error
    } finally {
      setCheckingUser(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const targetUsername = username || identifier;
        const res = await api.login(targetUsername, password);
        onSuccess(res.user);
        onClose();
      } else {
        const targetUsername = username || identifier;
        const targetEmail = email || (identifier.includes('@') ? identifier : `${targetUsername}@example.com`);
        const res = await api.register(targetUsername, targetEmail, password);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0e0a22]/95 border border-purple-500/30 shadow-[0_0_50px_rgba(147,51,234,0.3)] space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg mb-2">
            <div className="w-full h-full bg-[#0d091f] rounded-[15px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-black text-white">
            {mode === 'login' ? 'Sign In to Zuniobooks' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login'
              ? 'Enter your credentials to access your audiobooks library.'
              : 'Sign up to favorite audiobooks and track chapter progress.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Username or Email</label>
            <div className="relative flex items-center">
              <UserIcon className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => handleIdentifierChange(e.target.value)}
                placeholder="Enter username or email"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>
            {checkingUser && (
              <p className="text-[10px] text-cyan-400 mt-1">Checking account availability...</p>
            )}
            {!checkingUser && userDetected === true && (
              <p className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                ✓ Account found! Auto-switched to Login.
              </p>
            )}
            {!checkingUser && userDetected === false && identifier.trim() !== '' && (
              <p className="text-[10px] text-cyan-300 mt-1 font-semibold flex items-center gap-1">
                + New user detected! Auto-switched to Registration.
              </p>
            )}
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Username</label>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95"
          >
            {loading
              ? 'Authenticating...'
              : mode === 'login'
              ? 'Sign In to Account'
              : 'Create Account & Sign In'}
          </button>
        </form>

        {/* Switch Mode Toggle */}
        <div className="text-center pt-2 border-t border-white/5 text-xs text-slate-400">
          {mode === 'login' ? (
            <p>
              New here?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-cyan-300 font-bold hover:underline ml-1"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-cyan-300 font-bold hover:underline ml-1"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
