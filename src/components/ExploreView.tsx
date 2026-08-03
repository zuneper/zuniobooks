import React from 'react';
import { Play, Sparkles, Clock, Layers, Heart, Compass, Shield, PlusCircle } from 'lucide-react';
import { Book, User } from '../types';
import { useAudio } from '../context/AudioContext';
import { api } from '../lib/api';

interface ExploreViewProps {
  books: Book[];
  searchQuery?: string;
  onClearSearch?: () => void;
  onSelectBook: (book: Book) => void;
  user: User | null;
  onOpenAuth: () => void;
  onNavigateAdmin: () => void;
  refreshBooks: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  books,
  searchQuery,
  onClearSearch,
  onSelectBook,
  user,
  onOpenAuth,
  onNavigateAdmin,
  refreshBooks,
}) => {
  const { playBook, currentBook, isPlaying } = useAudio();

  const handleToggleFavorite = async (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    try {
      await api.toggleFavorite(book.id);
      refreshBooks();
    } catch {
      onOpenAuth();
    }
  };

  const formatDuration = (totalSeconds = 0) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const spotlightBook = books.length > 0 && !searchQuery ? books[0] : null;

  return (
    <div className="space-y-8 pb-28">
      {/* Active Search Results Banner */}
      {searchQuery && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-cyan-950/40 border border-cyan-500/30 shadow-lg">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Search Results for "<span className="text-cyan-300">{searchQuery}</span>"</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Found {books.length} matching audiobook{books.length === 1 ? '' : 's'}</p>
          </div>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition-colors self-start sm:self-auto"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Featured Hero Banner (if books exist and not searching) */}
      {spotlightBook && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-[#0d0922] border border-purple-500/20 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            <img
              src={spotlightBook.coverUrl}
              alt={spotlightBook.title}
              className="w-44 h-44 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-[0_0_30px_rgba(147,51,234,0.3)] border border-white/10 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => onSelectBook(spotlightBook)}
            />

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Audiobook</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {spotlightBook.title}
              </h1>

              <p className="text-sm text-cyan-200 font-medium">
                By <span className="font-bold text-white">{spotlightBook.author}</span> • Narrated by {spotlightBook.narrator}
              </p>

              <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 max-w-2xl leading-relaxed">
                {spotlightBook.description || 'Explore this captivating story in high fidelity audio.'}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <button
                  onClick={() => playBook(spotlightBook)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Listening</span>
                </button>

                <button
                  onClick={() => onSelectBook(spotlightBook)}
                  className="px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 text-xs sm:text-sm font-semibold border border-white/10 transition-colors"
                >
                  View Details & Chapters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Books Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <span>Audiobooks Catalog</span>
            <span className="text-xs font-normal text-slate-400">({books.length})</span>
          </h2>
          {user?.role === 'admin' && (
            <button
              onClick={onNavigateAdmin}
              className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 px-3 py-1.5 rounded-full border border-cyan-500/30"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add New Book</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {books.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center p-12 sm:p-16 rounded-3xl bg-gradient-to-b from-[#100b28]/60 to-[#080516]/80 border border-purple-500/20 shadow-2xl space-y-6">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 shadow-[0_0_30px_rgba(147,51,234,0.3)]">
              <Compass className="w-12 h-12 text-cyan-300 animate-spin-slow" />
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="text-2xl font-black text-white">The Cosmic Library is Empty</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                No audiobooks exist in the database yet. Create an account or sign in to start exploring audiobooks and listening to chapters.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {user?.role === 'admin' && (
                <button
                  onClick={onNavigateAdmin}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:opacity-90 transition-opacity"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Upload Your First Book</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Audiobook Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {books.map((book) => {
            const isPlayingThisBook = currentBook?.id === book.id && isPlaying;
            return (
              <div
                key={book.id}
                onClick={() => onSelectBook(book)}
                className="group relative flex flex-col bg-[#0e0a22]/80 hover:bg-[#150f33] rounded-2xl border border-white/5 hover:border-purple-500/30 p-3 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_10px_30px_rgba(147,51,234,0.2)] hover:-translate-y-1"
              >
                {/* Book Cover Image Container */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/40 mb-3">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Play Button Overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playBook(book);
                    }}
                    className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center shadow-lg transition-all duration-300 ${
                      isPlayingThisBook ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                  </button>

                  {/* Favorite Heart Button */}
                  <button
                    onClick={(e) => handleToggleFavorite(e, book)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md text-slate-300 hover:text-rose-400 transition-colors"
                  >
                    <Heart className={`w-3.5 h-3.5 ${book.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  {/* Category badge */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-cyan-300">
                    {book.genre}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between space-y-1">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{book.author}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-purple-400" />
                      {book.episodesCount || 0} Ch.
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {formatDuration(book.totalDurationSeconds)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
