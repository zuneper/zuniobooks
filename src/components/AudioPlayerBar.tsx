import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Volume1,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Heart,
  ListMusic
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';

const formatTime = (time: number) => {
  if (isNaN(time) || time < 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Smart Marquee with a separator to make the loop look clean
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
        maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
      }}
    >
      <motion.div
        className="flex whitespace-nowrap min-w-full"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: Math.max(12, text.length * 0.3), 
        }}
      >
        <span className="pr-8">{text} <span className="mx-4 text-white/30">•</span></span>
        <span className="pr-8">{text} <span className="mx-4 text-white/30">•</span></span>
      </motion.div>
    </div>
  );
};

export const AudioPlayerBar: React.FC = () => {
  const audioContext = useAudio() as any; 
  const {
    currentBook,
    currentEpisode,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlayPause,
    setVolume,
    seek
  } = audioContext;

  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) {
      setDragProgress(progress || 0);
    }
  }, [progress, isDragging]);

  if (!currentBook || !currentEpisode) return null;

  // Handle Main Progress Bar Dragging
  const handleProgressDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setDragProgress(pos * duration);
  };

  const handleProgressDragEnd = () => {
    if (isDragging) {
      if (seek) seek(dragProgress);
      setIsDragging(false);
    }
  };

  // Handle Volume Bar Dragging
  const handleVolumeDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!volumeBarRef.current || !setVolume) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setVolume(pos);
  };

  // Audiobook Skip Functions
  const skipForward15 = () => {
    if (seek && duration) seek(Math.min((progress || 0) + 15, duration));
  };
  
  const skipBackward15 = () => {
    if (seek) seek(Math.max((progress || 0) - 15, 0));
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const currentVol = volume ?? 1;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed bottom-0 inset-x-0 z-50 bg-[#181818] border-t border-[#282828] h-[90px] flex items-center select-none"
    >
      <div className="flex items-center justify-between w-full px-4 sm:px-6 max-w-[1600px] mx-auto h-full">
        
        {/* Left: Track Info */}
        <div className="flex items-center gap-3.5 w-[30%] min-w-[180px] pr-4">
          <img 
            src={currentBook.coverUrl} 
            alt="Cover" 
            className="w-14 h-14 rounded-md object-cover shadow-md bg-[#282828] flex-shrink-0"
          />
          <div className="flex flex-col min-w-0 w-full overflow-hidden justify-center">
            <SmartMarquee 
              text={currentBook.title} 
              className="text-[14px] font-normal text-white hover:underline cursor-pointer"
              threshold={25}
            />
            <SmartMarquee 
              text={currentEpisode.title} 
              className="text-[12px] text-[#b3b3b3] hover:text-white hover:underline cursor-pointer mt-0.5 transition-colors"
              threshold={30}
            />
          </div>
          <button className="text-[#b3b3b3] hover:text-white transition-colors ml-2 hidden sm:block">
            <Heart className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Playback Controls & Progress */}
        <div className="flex flex-col items-center justify-center w-[40%] max-w-[722px]">
          
          {/* Top Row: Buttons */}
          <div className="flex items-center gap-4 sm:gap-6 mb-2">
            <button 
              onClick={skipBackward15}
              className="text-[#b3b3b3] hover:text-white transition-colors active:scale-95"
              title="Rewind 15s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button className="text-[#4d4d4d] cursor-not-allowed hidden sm:block">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            
            <button 
              onClick={togglePlayPause}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current translate-x-[1px]" />
              )}
            </button>
            
            <button className="text-[#4d4d4d] cursor-not-allowed hidden sm:block">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
            
            <button 
              onClick={skipForward15}
              className="text-[#b3b3b3] hover:text-white transition-colors active:scale-95"
              title="Fast Forward 15s"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
          
          {/* Bottom Row: Progress Bar */}
          <div className="flex items-center gap-2 w-full max-w-[600px]">
            <span className="text-[11px] text-[#a7a7a7] font-mono min-w-[40px] text-right">
              {formatTime(dragProgress)}
            </span>
            
            <div 
              className="relative flex items-center h-4 flex-1 cursor-pointer group"
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
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white group-hover:bg-[#1ed760] transition-colors"
                  style={{ width: `${(dragProgress / (duration || 1)) * 100}%` }}
                />
              </div>
              <div 
                className="absolute w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity -ml-1.5"
                style={{ left: `${(dragProgress / (duration || 1)) * 100}%` }}
              />
            </div>
            
            <span className="text-[11px] text-[#a7a7a7] font-mono min-w-[40px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Extra Controls & Volume */}
        <div className="hidden sm:flex items-center justify-end w-[30%] min-w-[180px] gap-4">
          <button className="text-[#b3b3b3] hover:text-white transition-colors">
            <ListMusic className="w-[18px] h-[18px]" />
          </button>
          
          <div className="flex items-center gap-2 w-[93px] group">
            <button 
              onClick={() => setVolume && setVolume(currentVol === 0 ? 1 : 0)}
              className="text-[#b3b3b3] hover:text-white transition-colors"
            >
              <VolumeIcon className="w-[18px] h-[18px]" />
            </button>
            
            <div 
              className="relative flex items-center h-4 flex-1 cursor-pointer"
              ref={volumeBarRef}
              onMouseDown={handleVolumeDrag}
              onMouseMove={(e) => e.buttons === 1 && handleVolumeDrag(e)}
            >
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white group-hover:bg-[#1ed760] transition-colors"
                  style={{ width: `${currentVol * 100}%` }}
                />
              </div>
              <div 
                className="absolute w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity -ml-1.5"
                style={{ left: `${currentVol * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
