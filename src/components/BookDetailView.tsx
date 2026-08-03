import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowLeft, Clock, Shield, PlusCircle, Heart } from 'lucide-react';
import { Book, Episode, User } from '../types';
import { api } from '../lib/api';
import { useAudio } from '../context/AudioContext';

interface BookDetailViewProps {
  bookId: string;
  onBack: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onNavigateAdminUploadEpisode: (bookId: string) => void;
  refreshBooks: () => void;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

export const BookDetailView: React.FC<BookDetailViewProps> = ({
  bookId,
  onBack,
  user,
  onOpenAuth,
  onNavigateAdminUploadEpisode,
}) => {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const { currentEpisode, isPlaying, playEpisode, togglePlayPause } = useAudio();

  useEffect(() => {
    api.getBook(bookId).then((data) => {
      setBook(data);
      setIsFavorite(data.isFavorite || false);
      setLoading(false);
    });
  }, [bookId]);

  const handleToggleFavorite = async () => {
    if (!user) return onOpenAuth();
    const originalState = isFavorite;
    setIsFavorite(!isFavorite);
    try {
      const res = await api.toggleFavorite(bookId);
      setIsFavorite(res.isFavorite);
    } catch {
      setIsFavorite(originalState);
    }
  };

  if (loading || !book) return null; // Let the exit animation handle the loading state fluidly

  const isCurrentBookPlaying = isPlaying && currentEpisode?.bookId === book.id;

  return (
    <div className="pb-32 pt-2 max-w-[1200px] mx-auto">
      {/* Top Navigation */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-2 text-[#b3b3b3] hover:text-white transition-colors mb-8 group w-fit"
      >
        <div className="p-2 rounded-full bg-[#181818] group-hover:bg-[#282828] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="text-sm font-bold tracking-wide">Back</span>
      </motion.button>

      {/* Hero Header Section */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-10 mb-12">
        <motion.div 
          // layoutId connects this image to the one on the ExploreView for the flying animation
          layoutId={`book-cover-${book.id}`}
          className="w-full md:w-[300px] shrink-0 aspect-square rounded-lg overflow-hidden shadow-2xl bg-[#282828]"
        >
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col justify-end"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[#b3b3b3] mb-2">{book.genre}</p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-3">
            {book.title}
          </h1>
          <p className="text-lg text-[#b3b3b3] mb-6 font-medium">{book.author}</p>
          <p className="text-sm text-[#a7a7a7] leading-relaxed max-w-2xl mb-8">
            {book.description || 'No description available for this audiobook.'}
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (book.episodes && book.episodes.length > 0) {
                  if (currentEpisode?.bookId === book.id) togglePlayPause();
                  else playEpisode(book, book.episodes[0]);
                }
              }}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              {isCurrentBookPlaying ? <Pause className="w-6 h-6 text-black" /> : <Play className="w-6 h-6 text-black translate-x-0.5" />}
            </button>
            <button 
              onClick={handleToggleFavorite}
              className="flex items-center justify-center w-14 h-14 rounded-full border border-[#4d4d4d] hover:border-white transition-colors"
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'text-[#1ed760] fill-[#1ed760]' : 'text-[#b3b3b3]'}`} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Admin Quick Action */}
      {user?.role === 'admin' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <button
            onClick={() => onNavigateAdminUploadEpisode(book.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#282828] hover:bg-[#3e3e3e] text-white text-sm font-bold transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-[#1ed760]" />
            <span>Upload New Chapter</span>
          </button>
        </motion.div>
      )}

      {/* Chapter List */}
      <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
        <div className="flex items-center px-4 py-2 border-b border-[#282828] text-xs font-bold text-[#b3b3b3] uppercase tracking-wider mb-4">
          <div className="w-12 text-center">#</div>
          <div className="flex-1">Title</div>
          <div className="w-24 text-right"><Clock className="w-4 h-4 inline-block" /></div>
        </div>

        {book.episodes?.length === 0 ? (
          <p className="text-sm text-[#b3b3b3] px-4">No chapters have been uploaded yet.</p>
        ) : (
          book.episodes?.map((ep, index) => {
            const isThisEpisodePlaying = currentEpisode?.id === ep.id && isPlaying;
            const isThisEpisodeSelected = currentEpisode?.id === ep.id;

            return (
              <motion.div
                variants={itemVariants}
                key={ep.id}
                onClick={() => user ? playEpisode(book, ep) : onOpenAuth()}
                className={`flex items-center px-4 py-3 rounded-md cursor-pointer transition-colors group ${
                  isThisEpisodeSelected ? 'bg-[#282828]' : 'hover:bg-[#282828]'
                }`}
              >
                <div className="w-12 text-center">
                  <span className={`text-base font-medium group-hover:hidden ${isThisEpisodeSelected ? 'text-[#1ed760]' : 'text-[#b3b3b3]'}`}>
                    {index + 1}
                  </span>
                  <Play className={`w-4 h-4 mx-auto hidden group-hover:block ${isThisEpisodeSelected ? 'text-[#1ed760]' : 'text-white'}`} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className={`text-sm font-medium leading-relaxed truncate ${isThisEpisodeSelected ? 'text-[#1ed760]' : 'text-white'}`}>
                    {ep.title}
                  </h4>
                </div>
                <div className="w-24 text-right text-sm text-[#b3b3b3] font-mono">
                  {Math.floor(ep.durationSeconds / 60)}:{Math.floor(ep.durationSeconds % 60).toString().padStart(2, '0')}
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
};
