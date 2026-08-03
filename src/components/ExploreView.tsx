import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import { 
  Search, 
  Sparkles, 
  Clock, 
  Shield, 
  Layers,
  Heart
} from 'lucide-react';
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

// Interactive 3D Card Component
const AnimatedBookCard: React.FC<{ book: Book; onClick: () => void }> = ({ book, onClick }) => {
  // Motion values to track mouse position relative to the card center
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Add spring physics to make the movement feel organic and fluid
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  // Map mouse position to rotation degrees (tilt effect)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['12deg', '-12deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-12deg', '12deg']);
  
  // Map mouse position to percentage for the glare effect
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);
  
  // Construct the dynamic glass glare gradient
  const background = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255, 255, 255, 0.15) 0%, transparent 60%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate percentage offset from center (-0.5 to 0.5)
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    // Reset card to flat position smoothly when mouse leaves
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{ perspective: 1000 }} // Enable 3D space
      className="relative h-full"
    >
      <motion.div
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative group cursor-pointer flex flex-col h-full bg-[#0d0a1f]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-3.5 hover:border-cyan-500/40 transition-colors shadow-xl"
      >
        {/* Dynamic Light Glare */}
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"
          style={{ background }}
        />

        {/* Cover Image Layer (Pushed forward in 3D space) */}
        <div 
          className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 bg-[#110d26] shadow-lg shadow-black/50" 
          style={{ transform: 'translateZ(30px)' }}
        >
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black text-cyan-300 tracking-wider shadow-lg">
            {book.genre}
          </div>
          
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white shadow-lg">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>{book.episodesCount || 0} Ch.</span>
          </div>

          {book.isFavorite && (
            <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            </div>
          )}
        </div>
        
        {/* Text Details Layer (Pushed even further forward) */}
        <div className="flex-1 flex flex-col z-10" style={{ transform: 'translateZ(45px)' }}>
          <h3 className="text-sm font-bold text-white leading-tight mb-1 group-hover:text-cyan-300 transition-colors line-clamp-2">
            {book.title}
          </h3>
          <p className="text-xs text-slate-400 mb-2 font-medium">{book.author}</p>
          
          <div className="mt-auto flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{Math.floor((book.totalDurationSeconds || 0) / 60)}m</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
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

  const filteredBooks = books.filter((book) => {
    if (activeGenre !== 'All' && book.genre !== activeGenre) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-28">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/80 via-purple-900/60 to-cyan-950/80 border border-purple-500/20 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover the Universe</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-cyan-200">
            Expand Your Mind
          </h1>
          <p className="text-sm sm:text-base text-indigo-200 max-w-lg leading-relaxed">
            Journey through thousands of immersive audiobooks, narrated by the stars and crafted for the cosmic explorer.
          </p>
        </div>
        
        {/* Decorative Abstract Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] translate-y-1/2" />
      </div>

      {/* Admin Action Bar (if Admin) */}
      {user?.role === 'admin' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d0a20] border border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-xl">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Admin Dashboard</h3>
              <p className="text-xs text-slate-400">Manage catalog and upload new audio chapters.</p>
            </div>
          </div>
          <button
            onClick={onNavigateAdmin}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
          >
            Upload Content
          </button>
        </div>
      )}

      {/* Genre Filters */}
      {!searchQuery && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all snap-start ${
                activeGenre === genre
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Search Results Header */}
      {searchQuery && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            <span>Search Results for "{searchQuery}"</span>
          </h2>
          <button
            onClick={onClearSearch}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Book Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {filteredBooks.map((book) => (
            <AnimatedBookCard 
              key={book.id} 
              book={book} 
              onClick={() => onSelectBook(book)} 
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-white/5 rounded-3xl bg-black/20 backdrop-blur-sm">
          <Search className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-300 mb-2">No audiobooks found</h3>
          <p className="text-sm text-slate-500 max-w-md">
            {searchQuery
              ? `We couldn't find anything matching "${searchQuery}". Try different keywords or browse genres.`
              : `There are currently no audiobooks available in the ${activeGenre} genre.`}
          </p>
          {searchQuery && (
            <button
              onClick={onClearSearch}
              className="mt-6 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
};
