import React, { useState } from 'react';
import { Search, Sparkles, User as UserIcon, Shield, LogOut, Compass, Menu, X } from 'lucide-react';
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
  onToggleMobileMenu: () => void;
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
  onToggleMobileMenu,
}) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex flex-col px-4 sm:px-6 py-3.5 bg-[#09061a]/85 backdrop-blur-2xl border-b border-purple-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <button onClick={onToggleMobileMenu} className="md:hidden p-1.5 text-slate-300 hover:text-white transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div onClick={onNavigateHome} className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group transition-transform active:scale-95">
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1px] shadow-[0_0_20px_rgba(147,51,234,0.5)]">
              <div className="w-full h-full bg-[#0d0a1d] rounded-[11px] flex items-center justify-center group-hover:bg-[#141029] transition-colors">
                <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300 animate-pulse" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg sm:text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-cyan-200">
                Zuniobooks
              </span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Search */}
        <div className="hidden sm:flex relative flex-1 max-w-md mx-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audiobooks..."
            className="w-full pl-10 pr-8 py-2.5 text-sm text-slate-100 bg-white/[0.04] border border-white/10 rounded-full focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 placeholder-slate-400 transition-all backdrop-blur-xl"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white">
              Clear
            </button>
          )}
        </div>

        {/* Right: User Actions & Mobile Search Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="sm:hidden p-2 text-slate-300 hover:text-white"
          >
            {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              {user.role === 'admin' && (
                <button
                  onClick={onNavigateAdmin}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border bg-purple-950/40 text-purple-200 border-purple-500/30 hover:bg-purple-900/60"
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Admin</span>
                </button>
              )}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <UserIcon className="w-4 h-4 text-indigo-300" />
                <span className="text-xs font-medium text-slate-200">{user.username}</span>
              </div>
              <button onClick={onLogout} title="Log out" className="p-2 text-slate-400 hover:text-rose-400 transition-colors rounded-full hover:bg-white/5">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Bar (Expandable) */}
      {showMobileSearch && (
        <div className="sm:hidden mt-3 relative w-full pb-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audiobooks..."
            className="w-full pl-10 pr-8 py-2 text-xs text-slate-100 bg-white/[0.04] border border-white/10 rounded-full focus:outline-none focus:border-cyan-400"
          />
        </div>
      )}
    </header>
  );
};
