import React, { useState, useEffect } from 'react';
import { Search, Clock, Shield, Layers, Heart, X } from 'lucide-react';
import { Book, User } from '../types';

interface ExploreViewProps {
  books: Book[];
  searchQuery: string;
  onClearSearch: () => void;
  onSelectBook: (book: Book) => void;
  user: User | null;
  onOpenAuth: () => void;
  onNavigateAdmin: () => void;
  refreshBooks: () => void;
}

const GENRES = [
  'All',
  'Sci-Fi',
  'Cosmos',
  'Fantasy',
  'Mystery',
  'Thriller',
  'Business',
  'Self-Help',
  'Fiction',
  'Non-Fiction',
  'Classics',
];

// Clean, Flat Design Book Card
const BookCard: React.FC<{ book: Book; onClick: () => void }> = ({ book, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col h-full bg-[#181818] hover:bg-[#282828] rounded-xl p-4 transition-all duration-300 shadow-sm"
    >
      {/* Cover Image */}
      <div className="relative w-full aspect-square rounded-md overflow-hidden mb-4 bg-[#282828] shadow-md">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
          loading="lazy"
        />
        {book.isFavorite && (
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md">
            <Heart className="w-4 h-4 text-[#1ed760] fill-[#1ed760]" />
          </div>
        )}
      </div>
      
      {/* Text Details - Styled with relaxed leading to accommodate tall scripts like Burmese */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-[15px] font-bold text-white leading-relaxed mb-1 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-[13px] text-[#b3b3b3] mb-3 line-clamp-1">{book.author}</p>
        
        <div className="mt-auto flex items-center justify-between text-[12px] text-[#b3b3b3] font-medium pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>{book.episodesCount || 0} Ch.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{Math.floor((book.totalDurationSeconds || 0) / 60)}m</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExploreView: React.FC<ExploreViewProps> = ({
  books,
  searchQuery,
  onClearSearch,
  onSelectBook,
  user,
  onOpenAuth,
  onNavigateAdmin,
}) => {
  const [activeGenre, setActiveGenre] = useState('All');
  const [greeting, setGreeting] = useState('');

  // Dynamic human greeting based on local time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const filteredBooks = books.filter((book) => {
    if (activeGenre !== 'All' && book.genre !== activeGenre) return false;
    return true;
  });

  return (
    <div className="space-y-8 pb-32 pt-4 max-w-[1600px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
            {searchQuery ? 'Search Results' : greeting}
          </h1>
          {!searchQuery && (
            <p className="text-sm text-[#b3b3b3]">
              Find your next favorite audiobook.
            </p>
          )}
        </div>

        {/* Admin Action Button */}
        {user?.role === 'admin' && (
          <button
            onClick={onNavigateAdmin}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black hover:scale-105 text-sm font-bold transition-transform active:scale-95 w-fit"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Dashboard</span>
          </button>
        )}
      </div>

      {/* Genre Filters */}
      {!searchQuery && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors snap-start ${
                activeGenre === genre
                  ? 'bg-white text-black'
                  : 'bg-[#282828] text-white hover:bg-[#3e3e3e]'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Search Results Header */}
      {searchQuery && (
        <div className="flex items-center justify-between bg-[#282828] px-4 py-3 rounded-lg">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-[#b3b3b3]" />
            <span className="text-sm text-white">Showing results for <span className="font-bold">"{searchQuery}"</span></span>
          </div>
          <button
            onClick={onClearSearch}
            className="p-1.5 text-[#b3b3b3] hover:text-white rounded-full hover:bg-[#3e3e3e] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Book Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6">
          {filteredBooks.map((book) => (
            <BookCard 
              key={book.id} 
              book={book} 
              onClick={() => onSelectBook(book)} 
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <Search className="w-12 h-12 text-[#4d4d4d] mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No audiobooks found</h3>
          <p className="text-sm text-[#b3b3b3] max-w-md">
            {searchQuery
              ? `We couldn't find anything matching "${searchQuery}". Please try adjusting your search terms.`
              : `There are currently no audiobooks available in the ${activeGenre} genre.`}
          </p>
          {searchQuery && (
            <button
              onClick={onClearSearch}
              className="mt-6 px-6 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition-transform active:scale-95"
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
};
