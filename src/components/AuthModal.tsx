import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Library, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const user = await api.login(username, password);
        onSuccess(user);
      } else {
        const user = await api.register(username, password);
        onSuccess(user);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#181818] rounded-2xl p-8 z-[101] shadow-2xl border border-[#282828]"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[#b3b3b3] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-full bg-[#facc15] flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                <Library className="w-6 h-6 text-black" />
              </div>
              <h2 className="text-2xl font-black text-white">
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h2>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-6 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#b3b3b3] mb-1.5 uppercase tracking-wide">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-[#282828] border border-transparent rounded-md text-white focus:outline-none focus:border-[#facc15] focus:bg-[#3e3e3e] transition-all"
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#b3b3b3] mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#282828] border border-transparent rounded-md text-white focus:outline-none focus:border-[#facc15] focus:bg-[#3e3e3e] transition-all"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-4 rounded-full text-black bg-[#facc15] hover:bg-[#eab308] font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-[#282828]">
              <p className="text-[#b3b3b3] text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-white hover:text-[#facc15] font-bold transition-colors underline underline-offset-4"
                >
                  {isLogin ? 'Sign up for free' : 'Log in here'}
                </button>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
