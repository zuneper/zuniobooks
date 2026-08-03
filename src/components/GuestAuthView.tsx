import React, { useState } from 'react';
import { Sparkles, User as UserIcon, Mail, Lock, Headphones, BookOpen, ShieldCheck, ArrowRight, Radio } from 'lucide-react';
import { api } from '../lib/api';
import { User } from '../types';

interface GuestAuthViewProps {
  onSuccess: (user: User) => void;
}

export const GuestAuthView: React.FC<GuestAuthViewProps> = ({ onSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [userDetected, setUserDetected] = useState<boolean | null>(null);
  const [checkingUser, setCheckingUser] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      // ignore check error
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
      } else {
        const targetUsername = username || identifier;
        const targetEmail = email || (identifier.includes('@') ? identifier : `${targetUsername}@example.com`);
        const res = await api.register(targetUsername, targetEmail, password);
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Premium Brand Teaser */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left pr-0 lg:pr-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-cyan-900/60 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Radio className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-cyan-200 uppercase">
              Exclusive Audio Portal
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-white tracking-tight leading-none">
              Immerse Yourself in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-200">
                Endless Audiobooks
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Sign up or log in to unlock full streaming access to our curated audiobook library, multi-chapter playback, and personal listening history.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col items-center lg:items-start space-y-2">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Lossless Streaming</h3>
              <p className="text-xs text-slate-400 text-center lg:text-left">Crystal clear audio quality across all devices.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col items-center lg:items-start space-y-2">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Full Chapter Access</h3>
              <p className="text-xs text-slate-400 text-center lg:text-left">Resume exact timestamps and chapters seamlessly.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col items-center lg:items-start space-y-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Instant Account</h3>
              <p className="text-xs text-slate-400 text-center lg:text-left">Unified single-step login and registration.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Unified Signup/Login Card */}
        <div className="lg:col-span-5 w-full">
          <div className="relative p-6 sm:p-8 rounded-3xl bg-[#0b081e]/90 border border-purple-500/30 shadow-[0_0_50px_rgba(147,51,234,0.25)] backdrop-blur-2xl space-y-6">
            
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg mb-2">
                <div className="w-full h-full bg-[#0e0a24] rounded-[15px] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-white">
                {mode === 'login' ? 'Sign In to Zuniobooks' : 'Create Your Account'}
              </h2>
              <p className="text-xs text-slate-400">
                Enter your credentials to access audiobooks and start listening.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 font-medium animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Username or Email
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => handleIdentifierChange(e.target.value)}
                    placeholder="Enter username or email"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
                {checkingUser && (
                  <p className="text-[11px] text-cyan-400 mt-1">Checking account availability...</p>
                )}
                {!checkingUser && userDetected === true && (
                  <p className="text-[11px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                    ✓ Account found! Ready to Log In.
                  </p>
                )}
                {!checkingUser && userDetected === false && identifier.trim() !== '' && (
                  <p className="text-[11px] text-cyan-300 mt-1 font-semibold flex items-center gap-1">
                    + New account! Ready for Registration.
                  </p>
                )}
              </div>

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Username</label>
                    <div className="relative flex items-center">
                      <UserIcon className="absolute left-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a username"
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>
                  {loading
                    ? 'Authenticating...'
                    : mode === 'login'
                    ? 'Sign In to Account'
                    : 'Create Account & Start Listening'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-2 border-t border-white/10 text-xs text-slate-400">
              {mode === 'login' ? (
                <p>
                  New to Zuniobooks?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="text-cyan-300 font-bold hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="text-cyan-300 font-bold hover:underline"
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
