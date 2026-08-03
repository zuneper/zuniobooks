import React from 'react';
import { Home, Bookmark, Heart, Shield, Disc, Sparkles, Volume2 } from 'lucide-react';
import { User } from '../types';
import { useAudio } from '../context/AudioContext';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  user,
}) => {
  const { currentBook, currentEpisode, isPlaying } = useAudio();

  return (
    <aside className="w-64 flex-shrink-0 hidden md:flex flex-col bg-[#0b0819]/80 backdrop-blur-lg border-r border-white/5 p-4 space-y-6">
      {/* Primary Navigation */}
      <nav className="space-y-1">
        <button
          onClick={() => setActiveView('explore')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeView === 'explore'
              ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/40 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
          }`}
        >
          <Home className="w-4 h-4 text-cyan-400" />
          <span>Explore Books</span>
        </button>

        <button
          onClick={() => setActiveView('library')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeView === 'library'
              ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/40 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
          }`}
        >
          <Bookmark className="w-4 h-4 text-purple-400" />
          <span>Your Library</span>
        </button>

        <button
          onClick={() => setActiveView('favorites')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeView === 'favorites'
              ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/40 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-400" />
          <span>Favorites</span>
        </button>

        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveView('admin')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'admin'
                ? 'bg-gradient-to-r from-purple-800 to-indigo-800 text-white border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'text-purple-300 hover:text-white hover:bg-purple-900/30 border border-purple-500/20'
            }`}
          >
            <Shield className="w-4 h-4 text-cyan-300" />
            <span>Admin Upload Portal</span>
          </button>
        )}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Currently Playing Widget in Sidebar */}

      {/* Currently Playing Widget in Sidebar */}
      {currentBook && currentEpisode && (
        <div className="p-3 rounded-2xl bg-gradient-to-b from-purple-950/40 to-indigo-950/40 border border-purple-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <Volume2 className={`w-3.5 h-3.5 text-cyan-400 ${isPlaying ? 'animate-bounce' : ''}`} />
            <span className="text-[11px] font-semibold text-purple-200 uppercase tracking-wider">Now Playing</span>
          </div>
          <div className="flex items-center gap-2.5">
            <img
              src={currentBook.coverUrl}
              alt={currentBook.title}
              className="w-10 h-10 rounded-lg object-cover border border-white/10"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{currentBook.title}</p>
              <p className="text-[11px] text-cyan-300 truncate">{currentEpisode.title}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
