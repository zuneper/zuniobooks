import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Pause, ArrowLeft, Clock, PlusCircle, Heart } from 'lucide-react';
import { Book, Episode, User } from '../types';
import { api } from '../lib/api';
import { useAudio } from '../context/AudioContext';

interface BookDetailViewProps {
  user?: User | null;
  onOpenAuth?: () => void;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

export const BookDetailView: React.FC<BookDetailViewProps> = ({ user, onOpenAuth }) => {
  // ROUTER MAGIC: Grab the book and episode ID directly from the URL!
  const { bookId, episodeId } = useParams();
  const navigate = useNavigate();
  
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const { currentEpisode, isPlaying, playEpisode, togglePlayPause } = useAudio();

  useEffect(() => {
    if (bookId) {
      api.getBook(bookId).then((data) => {
        setBook(data);
        setIsFavorite(data.isFavorite || false);
        setLoading(false);
        
        // DEEP LINKING MAGIC: If an episode ID is in the URL, auto-play it!
        if (episodeId && data.episodes) {
          const targetEpisode = data.episodes.find((ep: Episode) => ep.id === episodeId);
          if (targetEpisode) {
            setTimeout(() => playEpisode(data, targetEpisode), 500);
          }
        }
      });
    }
  }, [bookId, episodeId, playEpisode]);

  const handleToggleFavorite = async () => {
    if (!user && onOpenAuth) return onOpenAuth();
    const originalState = isFavorite;
    setIsFavorite(!isFavorite);
    if (bookId) {
      try {
        const res = await api.toggleFavorite(bookId);
        setIsFavorite(res.isFavorite);
      } catch {
        setIsFavorite(originalState);
      }
    }
  };

  const handlePlayEpisode = (episode: Episode) => {
    if (!user && onOpenAuth) return onOpenAuth();
    if (book) {
      if (currentEpisode?.id === episode.id) {
        togglePlayPause();
      } else {
        playEpisode(book, episode);
      }
      // ROUTER MAGIC: Pushes the episode into the URL bar!
      navigate(`/book/${book.id}/episode/${episode.id}`, { replace: true });
    }
  };

  if (loading || !book) return <div className="text-center mt-20 text-[#b3b3b3]">Loading...</div>; 

  const isCurrentBookPlaying = isPlaying && currentEpisode?.bookId === book.id;

  return (
    <div className="relative min-h-screen pb-32 pt-4 px-4 md:px-8 max-w-[1200px] mx-auto z-10">
      <div className="absolute top-[-50px] left-[-10vw] right-[-10vw] h-[600px] overflow-hidden -z-10 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-cover bg-center blur-[100px] transform scale-125 origin-top"
          style={{ backgroundImage: `url(${book.coverUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#121212]/80 to-[#121212]" />
      </div>

      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        // ROUTER MAGIC: Native backward navigation
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#b3b3b3] hover:text-white transition-colors mb-10 group w-fit"
      >
        <div className="p-2 rounded-full bg-black/20 backdrop-blur-md group-hover:bg-black/40 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="text-sm font-bold tracking-wide">Back</span>
      </motion.button>

      <div className="flex flex-col md:flex-row gap-8 md:gap-10 mb-12 items-end">
        <motion.div 
          layoutId={`book-cover-${book.id}`}
          className="w-full sm:w-64 md:w-[280px] shrink-0 aspect-square rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#282828]"
        >
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col w-full"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 mb-2 drop-shadow-md">
            Audiobook • {book.genre}
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-4 drop-shadow-lg line-clamp-3">
            {book.title}
          </h1>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 rounded-full bg-[#282828] flex items-center justify-center overflow-hidden">
              <span className="text-[10px] font-bold text-white">{book.author.charAt(0)}</span>
            </div>
            <p className="text-sm font-bold text-white drop-shadow-md">
              {book.author} 
              <span className="text-white/60 font-normal"> • {book.episodes?.length || 0} Chapters</span>
            </p>
          </div>

          <p className="text-sm text-[#b3b3b3] leading-relaxed max-w-2xl mb-8 line-clamp-3">
            {book.description || 'No description available for this audiobook.'}
          </p>

          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                if (book.episodes && book.episodes.length > 0) {
                  if (currentEpisode?.bookId === book.id) {
                     togglePlayPause();
                  } else {
                     handlePlayEpisode(book.episodes[0]);
                  }
                }
              }}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-[#facc15] hover:bg-[#eab308] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_16px_rgba(250,204,21,0.3)]"
            >
              {isCurrentBookPlaying ? <Pause className="w-6 h-6 text-black" /> : <Play className="w-6 h-6 text-black translate-x-0.5" />}
            </button>
            <button 
              onClick={handleToggleFavorite}
              className="flex items-center justify-center group"
            >
              <Heart className={`w-8 h-8 transition-transform group-hover:scale-110 group-active:scale-90 ${isFavorite ? 'text-[#facc15] fill-[#facc15]' : 'text-[#b3b3b3] hover:text-white'}`} />
            </button>
          </div>
        </motion.div>
      </div>

      {user?.role === 'admin' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
          <button
            // ADMIN ROUTING MAGIC: Appends the specific book ID to the URL!
            onClick={() => navigate(`/admin?bookId=${book.id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-[#facc15]" />
            <span>Upload New Chapter in Admin</span>
          </button>
        </motion.div>
      )}

      <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-1">
        <div className="flex items-center px-4 py-2 border-b border-white/10 text-xs font-bold text-[#b3b3b3] uppercase tracking-wider mb-4 sticky top-0 bg-[#121212]/95 backdrop-blur-md z-20">
          <div className="w-12 text-center">#</div>
          <div className="flex-1">Title</div>
          <div className="w-24 text-right"><Clock className="w-4 h-4 inline-block" /></div>
        </div>

        {book.episodes?.length === 0 ? (
          <p className="text-sm text-[#b3b3b3] px-4">No chapters have been uploaded yet.</p>
        ) : (
          book.episodes?.map((ep, index) => {
            const isThisEpisodeSelected = currentEpisode?.id === ep.id;

            return (
              <motion.div
                variants={itemVariants}
                key={ep.id}
                onClick={() => handlePlayEpisode(ep)}
                className={`flex items-center px-4 py-3 rounded-md cursor-pointer transition-colors group ${
                  isThisEpisodeSelected ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="w-12 text-center">
                  <span className={`text-base font-medium group-hover:hidden ${isThisEpisodeSelected ? 'text-[#facc15]' : 'text-[#b3b3b3]'}`}>
                    {index + 1}
                  </span>
                  <Play className={`w-4 h-4 mx-auto hidden group-hover:block ${isThisEpisodeSelected ? 'text-[#facc15]' : 'text-white'}`} />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className={`text-base font-medium leading-relaxed truncate ${isThisEpisodeSelected ? 'text-[#facc15]' : 'text-white'}`}>
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
