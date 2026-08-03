import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Clock,
  Layers,
  Heart,
  Plus,
  Trash2,
  Mic,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { Book, Episode, User } from '../types';
import { useAudio } from '../context/AudioContext';
import { api } from '../lib/api';

interface BookDetailViewProps {
  bookId: string;
  onBack: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onNavigateAdminUploadEpisode: (bookId: string) => void;
  refreshBooks: () => void;
}

export const BookDetailView: React.FC<BookDetailViewProps> = ({
  bookId,
  onBack,
  user,
  onOpenAuth,
  onNavigateAdminUploadEpisode,
  refreshBooks,
}) => {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { playBook, playEpisode, currentEpisode, isPlaying, togglePlayPause, progressMap } = useAudio();

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getBook(bookId);
      setBook(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookDetails();
  }, [bookId]);

  const handleToggleFav = async () => {
    if (!book) return;
    try {
      const res = await api.toggleFavorite(book.id);
      setBook({ ...book, isFavorite: res.isFavorite });
      refreshBooks();
    } catch {
      onOpenAuth();
    }
  };

  const handleDeleteEpisode = async (episodeId: string) => {
    if (!window.confirm('Are you sure you want to delete this chapter?')) return;
    try {
      await api.deleteEpisode(episodeId);
      fetchBookDetails();
      refreshBooks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete episode');
    }
  };

  const formatSeconds = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatTotalTime = (sec = 0) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-400 font-semibold">{error || 'Book not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const episodes = book.episodes || [];

  return (
    <div className="space-y-8 pb-28">
      {/* Top Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Audiobooks</span>
      </button>

      {/* Book Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-purple-950/70 via-indigo-950/60 to-[#0b0819] border border-purple-500/20 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start gap-6 sm:gap-8">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl object-cover shadow-[0_0_30px_rgba(147,51,234,0.3)] border border-white/10 flex-shrink-0"
          />

          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                {book.genre}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                {episodes.length} Episodes
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {formatTotalTime(book.totalDurationSeconds)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">{book.title}</h1>

            <div className="space-y-1 text-xs sm:text-sm text-cyan-200">
              <p>
                Author: <span className="font-bold text-white">{book.author}</span>
              </p>
              <p className="flex items-center gap-1 text-slate-300">
                <Mic className="w-3.5 h-3.5 text-indigo-400" />
                Narrated by <span className="font-semibold text-slate-100">{book.narrator}</span>
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {book.description || 'No description available for this audiobook.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => playBook(book)}
                disabled={episodes.length === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 ${
                  episodes.length > 0
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{episodes.length > 0 ? 'Play Audiobook' : 'No Audio Files Yet'}</span>
              </button>

              <button
                onClick={handleToggleFav}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-rose-400 border border-white/10 transition-colors"
                title="Favorite"
              >
                <Heart className={`w-4 h-4 ${book.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>

              {user?.role === 'admin' && (
                <button
                  onClick={() => onNavigateAdminUploadEpisode(book.id)}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-full bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Chapter File</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters / Episodes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Chapters & Segments</span>
          </h3>
        </div>

        {episodes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <p className="text-sm text-slate-400">No episodes or chapters have been uploaded for this book yet.</p>
            {user?.role === 'admin' && (
              <button
                onClick={() => onNavigateAdminUploadEpisode(book.id)}
                className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
              >
                Upload First Chapter Audio
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {episodes.map((episode) => {
              const isCurrent = currentEpisode?.id === episode.id;
              const isPlayingCurrent = isCurrent && isPlaying;
              const prog = progressMap[episode.id];
              const progressPct =
                prog && prog.durationSeconds > 0
                  ? Math.min(100, (prog.positionSeconds / prog.durationSeconds) * 100)
                  : 0;

              return (
                <div
                  key={episode.id}
                  onClick={() => playEpisode(book, episode, episodes)}
                  className={`group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-gradient-to-r from-purple-900/60 to-cyan-900/40 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-[#0d0920]/80 hover:bg-[#140e30] border-white/5 hover:border-purple-500/20'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Play/Pause Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) {
                          togglePlayPause();
                        } else {
                          playEpisode(book, episode, episodes);
                        }
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isCurrent
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-white/10 group-hover:bg-purple-600 text-white'
                      }`}
                    >
                      {isPlayingCurrent ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-purple-300">Track #{episode.trackNumber}</span>
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isCurrent ? 'text-cyan-300' : 'text-white'
                          }`}
                        >
                          {episode.title}
                        </h4>
                      </div>

                      {/* Progress Bar if listened */}
                      {progressPct > 0 && (
                        <div className="w-full max-w-xs h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0 ml-3">
                    {isPlayingCurrent && (
                      <div className="hidden sm:flex items-center gap-1 text-cyan-400 text-xs font-semibold">
                        <Volume2 className="w-4 h-4 animate-pulse" />
                        <span>Playing</span>
                      </div>
                    )}

                    <span className="text-xs text-slate-400 font-mono">
                      {formatSeconds(episode.durationSeconds)}
                    </span>

                    {user?.role === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEpisode(episode.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Episode"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
