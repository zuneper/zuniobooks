import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Clock, Layers, Heart, Library as LibraryIcon } from 'lucide-react';
import { Book, User } from '../types';
import { api } from '../lib/api';

interface LibraryViewProps {
  onSelectBook: (book: Book) => void;
  user: User | null;
  onOpenAuth: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export const LibraryView: React.FC<LibraryViewProps> = ({ onSelectBook, user, onOpenAuth }) => {
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getFavorites()
        .then((data) => {
          setFavorites(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center max-w-[1600px] mx-auto">
        <LibraryIcon className="w-16 h-16 text-[#4d4d4d] mb-6" />
        <h2 className="text-3xl font-bold text-white mb-3">Your Library</h2>
        <p className="text-[#b3b3b3] max-w-md mb-8">Log in to save your favorite audiobooks and keep track of your listening progress across all devices.</p>
        <button
          onClick={onOpenAuth}
          className="px-8 py-3 rounded-full bg-white text-black font-bold hover:scale-105 active:scale-95 transition-transform"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-4 max-w-[1600px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Favorites</h1>
        <p className="text-sm text-[#b3b3b3]">The audiobooks you've saved for later.</p>
      </motion.div>

      {!loading && favorites.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
          <Bookmark className="w-12 h-12 text-[#4d4d4d] mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No favorites yet</h3>
          <p className="text-sm text-[#b3b3b3]">Click the heart icon on any audiobook to add it to your library.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6"
        >
          {favorites.map((book) => (
            <motion.div
              key={book.id}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectBook(book)}
              className="group cursor-pointer flex flex-col h-full bg-[#181818] hover:bg-[#282828] rounded-xl p-4 transition-colors duration-300 shadow-sm"
            >
              <div className="relative w-full aspect-square rounded-md overflow-hidden mb-4 bg-[#282828]">
                <motion.img
                  layoutId={`book-cover-${book.id}`}
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md">
                  <Heart className="w-4 h-4 text-[#1ed760] fill-[#1ed760]" />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <h3 className="text-[15px] font-bold text-white leading-relaxed mb-1 line-clamp-2">{book.title}</h3>
                <p className="text-[13px] text-[#b3b3b3] mb-3 line-clamp-1">{book.author}</p>
                
                <div className="mt-auto flex items-center justify-between text-[12px] text-[#b3b3b3] font-medium pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /><span>{book.episodesCount || 0} Ch.</span></div>
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /><span>{Math.floor((book.totalDurationSeconds || 0) / 60)}m</span></div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
