import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Search, Clock, Shield, Layers, Heart, X, Loader2 } from 'lucide-react';
import { Book, User } from '../types';
import { api } from '../lib/api';

interface ExploreViewProps {
  searchQuery?: string;
  onClearSearch?: () => void;
  user?: User | null;
  onNavigateAdmin?: () => void;
}

const GENRES = [
  'All', 'Sci-Fi', 'Cosmos', 'Fantasy', 'Mystery', 
  'Thriller', 'Business', 'Self-Help', 'Fiction', 'Non-Fiction', 'Classics'
];

const BookCard: React.FC<{ book: Book; onClick: () => void }> = ({ book, onClick }) => {
  return (
    <div onClick={onClick} className="group cursor-pointer flex flex-col h-full bg-[#181818] hover:bg-[#282828] rounded-xl p-4 transition-all duration-300 shadow-sm">
      <div className="relative w-full aspect-square rounded-md overflow-hidden mb-4 bg-[#282828] shadow-md">
        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" loading="lazy" />
        {book.isFavorite && (
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md">
            <Heart className="w-4 h-4 text-[#facc15] fill-[#facc15]" />
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col">
        <h3 className="text-[15px] font-bold text-white leading-relaxed mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-[13px] text-[#b3b3b3] mb-3 line-clamp-1">{book.author}</p>
        <div className="mt-auto flex items-center justify-between text-[12px] text-[#b3b3b3] font-medium pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /><span>{book.episodesCount || 0} Ch.</span></div>
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /><span>{Math.floor((book.totalDurationSeconds || 0) / 60)}m</span></div>
        </div>
      </div>
    </div>
  );
};

export const ExploreView: React.FC<ExploreViewProps> = ({
  searchQuery = '',
  onClearSearch,
  user,
  onNavigateAdmin,
}) => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState('All');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getBooks().then(data => {
      setBooks(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const filteredBooks = books.filter((book) => {
    if (activeGenre !== 'All' && book.genre !== activeGenre) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q) || book.genre.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-32 pt-4 max-w-[1600px] mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
            {searchQuery ? 'Search Results' : greeting}
          </h1>
          {!searchQuery && (
            <p className="text-sm text-[#b3b3b3]">Find your next favorite audiobook.</p>
          )}
        </div>
        {user?.role === 'admin' && onNavigateAdmin && (
          <button onClick={onNavigateAdmin} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black hover:scale-105 text-sm font-bold transition-transform active:scale-95 w-fit">
            <Shield className="w-4 h-4" /><span>Admin Dashboard</span>
          </button>
        )}
      </div>

      {!searchQuery && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors snap-start ${
                activeGenre === genre ? 'bg-white text-black' : 'bg-[#282828] text-white hover:bg-[#3e3e3e]'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {searchQuery && (
        <div className="flex items-center justify-between bg-[#282828] px-4 py-3 rounded-lg">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-[#b3b3b3]" />
            <span className="text-sm text-white">Showing results for <span className="font-bold">"{searchQuery}"</span></span>
          </div>
          {onClearSearch && (
            <button onClick={onClearSearch} className="p-1.5 text-[#b3b3b3] hover:text-white rounded-full hover:bg-[#3e3e3e] transition-colors"><X className="w-4 h-4" /></button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-10 h-10 text-[#facc15] animate-spin" /></div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} onClick={() => navigate(`/book/${book.id}`)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <Search className="w-12 h-12 text-[#4d4d4d] mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No audiobooks found</h3>
          <p className="text-sm text-[#b3b3b3] max-w-md">
            {searchQuery ? `We couldn't find anything matching "${searchQuery}".` : `There are currently no audiobooks available in this genre.`}
          </p>
        </div>
      )}
    </div>
  );
};
