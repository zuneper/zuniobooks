import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Volume1 
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';

// Helper to format seconds into MM:SS
const formatTime = (time: number) => {
  if (isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Smart Marquee Component: Only scrolls if the text is exceptionally long
const SmartMarquee: React.FC<{ text: string; className?: string; threshold?: number }> = ({ 
  text, 
  className = '', 
  threshold = 24 
}) => {
  const isLong = text.length > threshold;
  
  if (!isLong) {
    return <div className={`truncate ${className}`}>{text}</div>;
  }

  return (
    <div 
      className={`flex overflow-hidden whitespace-nowrap relative w-full ${className}`}
      style={{ 
        // Creates a seamless fade-out effect on the left and right edges
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
      }}
    >
      <motion.div
        className="flex whitespace-nowrap min-w-full"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          // Adjust scroll speed dynamically based on how long the text is
          duration: Math.max(10, text.length * 0.25), 
        }}
      >
        <span className="pr-12">{text}</span>
        <span className="pr-12">{text}</span>
      </motion.div>
    </div>
  );
};

export const AudioPlayerBar: React.FC = () => {
  const {
    currentBook,
    currentEpisode,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlayPause,
    seek,
    setVolume,
    playNext,
    playPrevious,
  } = useAudio();

  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) {
      setDragProgress(progress);
    }
  }, [progress, isDragging]);

  if (!currentBook || !currentEpisode) return null;

  const handleProgressDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setDragProgress(pos * duration);
  };

  const handleProgressDragEnd = () => {
    if (isDragging) {
      seek(dragProgress);
      setIsDragging(false);
    }
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed bottom-0 inset-x-0 z-50 bg-[#070415]/90 backdrop-blur-3xl border-t border-purple-500/20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
    >
      {/* Top Progress Bar */}
      <div 
        className="absolute top-0 inset-x-0 h-1.5 bg-white/5 cursor-pointer group"
        ref={progressBarRef}
        onMouseDown={(e) => {
          setIsDragging(true);
          handleProgressDrag(e);
        }}
        onMouseMove={(e) => isDragging && handleProgressDrag(e)}
        onMouseUp={handleProgressDragEnd}
        onMouseLeave={handleProgressDragEnd}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleProgressDrag(e);
        }}
        onTouchMove={(e) => isDragging && handleProgressDrag(e)}
        onTouchEnd={handleProgressDragEnd}
      >
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500 group-hover:from-cyan-400 group-hover:to-purple-400 transition-colors"
          style={{ width: `${(dragProgress / (duration || 1)) * 100}%` }}
        />
        {/* Playhead thumb */}
        <div 
          className="absolute top-1/2 -mt-1.5 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${(dragProgress / (duration || 1)) * 100}% - 6px)` }}
        />
      </div>

      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-[1600px] mx-auto">
        
        {/* Left: Track Info & Smart Marquee */}
        <div className="flex items-center gap-3 sm:gap-4 w-1/3 min-w-0 pr-4">
          <div className="relative shrink-0">
            <img 
              src={currentBook.coverUrl} 
              alt="Cover" 
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shadow-lg shadow-black/50"
            />
            {isPlaying && (
              <div className="absolute inset-0 rounded-xl ring-2 ring-cyan-500/50 animate-pulse-glow" />
            )}
          </div>
          <div className="flex flex-col min-w-0 w-full overflow-hidden">
            <SmartMarquee 
              text={currentBook.title} 
              className="text-sm sm:text-base font-bold text-white leading-tight"
              threshold={20}
            />
            <SmartMarquee 
              text={currentEpisode.title} 
              className="text-xs text-cyan-300 font-medium mt-0.5"
              threshold={25}
            />
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex flex-col items-center justify-center w-1/3">
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={playPrevious}
              className="p-2 text-slate-400 hover:text-white transition-colors active:scale-95"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            
            <button 
              onClick={togglePlayPause}
              className="p-3.5 rounded-full bg-white text-black hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
              )}
            </button>
            
            <button 
              onClick={playNext}
              className="p-2 text-slate-400 hover:text-white transition-colors active:scale-95"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
          
          {/* Time Indicators (Mobile Hidden) */}
          <div className="hidden sm:flex items-center justify-between w-full max-w-xs mt-1.5 px-4">
            <span className="text-[10px] font-mono text-slate-400">{formatTime(dragProgress)}</span>
            <span className="text-[10px] font-mono text-slate-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume Control (Mobile Hidden) */}
        <div className="hidden sm:flex items-center justify-end w-1/3 gap-3">
          <button 
            onClick={() => setVolume(volume === 0 ? 1 : 0)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <VolumeIcon className="w-5 h-5" />
          </button>
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden flex items-center relative group">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
              className="h-full bg-cyan-400 group-hover:bg-cyan-300 transition-colors pointer-events-none"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
