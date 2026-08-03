import React from 'react';
import { Search, Sparkles, User as UserIcon, Shield, LogOut, Compass } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNavigateAdmin: () => void;
  onNavigateHome: () => void;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  searchQuery,
  setSearchQuery,
  onOpenAuth,
  onLogout,
  onNavigateAdmin,
  onNavigateHome,
  activeView,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#09061a]/75 backdrop-blur-2xl border-b border-purple-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
      {/* Brand Logo */}
      <div
        onClick={onNavigateHome}
        className="flex items-center gap-2.5 cursor-pointer group transition-transform active:scale-95"
      >
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1px] shadow-[0_0_20px_rgba(147,51,234,0.5)]">
          <div className="w-full h-full bg-[#0d0a1d] rounded-[11px] flex items-center justify-center group-hover:bg-[#141029] transition-colors">
            <Compass className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
        </div>
        <div>
          <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-cyan-200">
            Zuniobooks
          </span>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="relative flex-1 max-w-md mx-4 sm:mx-8">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audiobooks, authors, narrators (or Burmese titles)..."
            className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm text-slate-100 bg-white/[0.04] border border-white/10 rounded-full focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_20px_rgba(6,182,212,0.25)] placeholder-slate-400 transition-all backdrop-blur-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <button
                onClick={onNavigateAdmin}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  activeView === 'admin'
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-purple-950/40 text-purple-200 border-purple-500/30 hover:bg-purple-900/60'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Admin Upload Portal</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <UserIcon className="w-4 h-4 text-indigo-300" />
              <span className="text-xs font-medium text-slate-200">{user.username}</span>
            </div>

            <button
              onClick={onLogout}
              title="Log out"
              className="p-2 text-slate-400 hover:text-rose-400 transition-colors rounded-full hover:bg-white/5"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all duration-300 shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] border border-cyan-400/30 hover:scale-[1.03] active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>Signup/Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
