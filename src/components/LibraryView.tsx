import React, { useState, useEffect } from 'react';
import { Bookmark, Heart, Clock, Play } from 'lucide-react';
import { Book, User } from '../types';
import { useAudio } from '../context/AudioContext';
import { api } from '../lib/api';

interface LibraryViewProps {
  onSelectBook: (book: Book) => void;
  user: User | null;
  onOpenAuth: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onSelectBook,
  user,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'in_progress'>('favorites');
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { playBook, progressMap } = useAudio();

  const fetchLibrary = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const favs = await api.getFavorites();
      setFavoriteBooks(favs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, [user]);

  if (!user) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/5 space-y-4 max-w-lg mx-auto">
        <Bookmark className="w-12 h-12 text-cyan-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Sign in to view your Library</h2>
        <p className="text-sm text-slate-300">
          Save your favorite audiobooks, track chapter listening progress across devices, and keep your space collection organized.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all relative ${
            activeTab === 'favorites' ? 'text-cyan-300 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-400" />
          <span>Favorite Audiobooks ({favoriteBooks.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : favoriteBooks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/5 space-y-3">
          <p className="text-slate-300 font-medium">You haven't added any favorite audiobooks yet.</p>
          <p className="text-xs text-slate-400">Click the heart icon on any audiobook to save it here!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {favoriteBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => onSelectBook(book)}
              className="group relative bg-[#0e0a22]/80 hover:bg-[#150f33] rounded-2xl border border-white/5 p-3 transition-all cursor-pointer"
            >
              <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2">
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playBook(book);
                  }}
                  className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
              <h4 className="text-xs font-bold text-white truncate">{book.title}</h4>
              <p className="text-[11px] text-slate-400 truncate">{book.author}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
