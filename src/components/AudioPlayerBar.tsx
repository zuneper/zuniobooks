import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Volume2, VolumeX, Volume1,
  SkipBack, SkipForward, RotateCcw, RotateCw, Heart, Moon
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { api } from '../lib/api';

const formatTime = (time: number) => {
  if (isNaN(time) || time < 0) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const SmartMarquee: React.FC<{ text: string; className?: string; threshold?: number }> = ({ 
  text, className = '', threshold = 24 
}) => {
  const isLong = text.length > threshold;
  if (!isLong) return <div className={`truncate ${className}`}>{text}</div>;

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
        transition={{ repeat: Infinity, ease: 'linear', duration: Math.max(12, text.length * 0.3) }}
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
    currentBook, currentEpisode, isPlaying, progress, duration, volume, 
    playbackRate = 1, togglePlayPause, setVolume, setPlaybackRate, seek
  } = audioContext;

  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  
  // New Feature States
  const [isFavorite, setIsFavorite] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const sleepMenuRef = useRef<HTMLDivElement>(null);

  // Sync favorite state
  useEffect(() => {
    setIsFavorite(currentBook?.isFavorite || false);
  }, [currentBook]);

  // Handle clicking outside of menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) setShowSpeedMenu(false);
      if (sleepMenuRef.current && !sleepMenuRef.current.contains(e.target as Node)) setShowSleepMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sleep Timer Countdown Logic
  useEffect(() => {
    if (sleepTimer === null || !isPlaying) return;
    const interval = setInterval(() => {
      setSleepTimer(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (togglePlayPause) togglePlayPause(); // Pause the audio!
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimer, isPlaying, togglePlayPause]);

  useEffect(() => {
    if (!isDragging) setDragProgress(progress || 0);
  }, [progress, isDragging]);

  if (!currentBook || !currentEpisode) return null;

  const handleToggleFavorite = async () => {
    const originalState = isFavorite;
    setIsFavorite(!isFavorite); // Optimistic UI update
    try {
      const res = await api.toggleFavorite(currentBook.id);
      setIsFavorite(res.isFavorite);
    } catch (err) {
      setIsFavorite(originalState);
    }
  };

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

  const handleVolumeDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!volumeBarRef.current || !setVolume) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setVolume(pos);
  };

  const skipForward15 = () => { if (seek && duration) seek(Math.min((progress || 0) + 15, duration)); };
  const skipBackward15 = () => { if (seek) seek(Math.max((progress || 0) - 15, 0)); };

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
        
        {/* Left: Track Info & Favorite */}
        <div className="flex items-center gap-3.5 w-[30%] min-w-[180px] pr-4">
          <img 
            src={currentBook.coverUrl} 
            alt="Cover" 
            className="w-14 h-14 rounded-md object-cover shadow-md bg-[#282828] flex-shrink-0"
          />
          <div className="flex flex-col min-w-0 w-full overflow-hidden justify-center">
            <SmartMarquee text={currentBook.title} className="text-[14px] font-normal text-white hover:underline cursor-pointer" threshold={25} />
            <SmartMarquee text={currentEpisode.title} className="text-[12px] text-[#b3b3b3] hover:text-white hover:underline cursor-pointer mt-0.5 transition-colors" threshold={30} />
          </div>
          <button 
            onClick={handleToggleFavorite}
            className={`${isFavorite ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'} transition-colors ml-2 hidden sm:block active:scale-95`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center: Playback Controls & Progress */}
        <div className="flex flex-col items-center justify-center w-[40%] max-w-[722px]">
          <div className="flex items-center gap-4 sm:gap-6 mb-2">
            <button onClick={skipBackward15} className="text-[#b3b3b3] hover:text-white transition-colors active:scale-95" title="Rewind 15s"><RotateCcw className="w-4 h-4" /></button>
            <button className="text-[#4d4d4d] cursor-not-allowed hidden sm:block"><SkipBack className="w-5 h-5 fill-current" /></button>
            <button 
              onClick={togglePlayPause}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-[1px]" />}
            </button>
            <button className="text-[#4d4d4d] cursor-not-allowed hidden sm:block"><SkipForward className="w-5 h-5 fill-current" /></button>
            <button onClick={skipForward15} className="text-[#b3b3b3] hover:text-white transition-colors active:scale-95" title="Fast Forward 15s"><RotateCw className="w-4 h-4" /></button>
          </div>
          
          <div className="flex items-center gap-2 w-full max-w-[600px]">
            <span className="text-[11px] text-[#a7a7a7] font-mono min-w-[40px] text-right">{formatTime(dragProgress)}</span>
            <div 
              className="relative flex items-center h-4 flex-1 cursor-pointer group"
              ref={progressBarRef}
              onMouseDown={(e) => { setIsDragging(true); handleProgressDrag(e); }}
              onMouseMove={(e) => isDragging && handleProgressDrag(e)}
              onMouseUp={handleProgressDragEnd}
              onMouseLeave={handleProgressDragEnd}
              onTouchStart={(e) => { setIsDragging(true); handleProgressDrag(e); }}
              onTouchMove={(e) => isDragging && handleProgressDrag(e)}
              onTouchEnd={handleProgressDragEnd}
            >
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
                <div className="h-full bg-white group-hover:bg-[#1ed760] transition-colors" style={{ width: `${(dragProgress / (duration || 1)) * 100}%` }} />
              </div>
              <div className="absolute w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity -ml-1.5" style={{ left: `${(dragProgress / (duration || 1)) * 100}%` }} />
            </div>
            <span className="text-[11px] text-[#a7a7a7] font-mono min-w-[40px]">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Extra Controls & Volume */}
        <div className="hidden sm:flex items-center justify-end w-[30%] min-w-[180px] gap-4">
          
          {/* Speed Button Menu */}
          <div className="relative flex items-center" ref={speedMenuRef}>
            <button
              onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowSleepMenu(false); }}
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md border ${playbackRate !== 1 ? 'border-[#1ed760] text-[#1ed760]' : 'border-[#b3b3b3] text-[#b3b3b3] hover:text-white hover:border-white'} transition-colors`}
              title="Playback Speed"
            >
              {playbackRate}x
            </button>
            <AnimatePresence>
              {showSpeedMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-4 right-0 bg-[#282828] border border-[#3e3e3e] rounded-lg shadow-2xl p-1.5 w-24 flex flex-col gap-1"
                >
                  {[0.5, 0.8, 1, 1.2, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => { if(setPlaybackRate) setPlaybackRate(speed); setShowSpeedMenu(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${playbackRate === speed ? 'text-[#1ed760] font-bold bg-[#3e3e3e]' : 'text-[#b3b3b3] hover:bg-[#3e3e3e] hover:text-white'}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sleep Timer Menu */}
          <div className="relative flex items-center" ref={sleepMenuRef}>
            <button
              onClick={() => { setShowSleepMenu(!showSleepMenu); setShowSpeedMenu(false); }}
              className={`flex items-center gap-1 transition-colors ${sleepTimer ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'}`}
              title="Sleep Timer"
            >
              <Moon className="w-[18px] h-[18px]" />
              {sleepTimer && <span className="text-[10px] font-mono">{formatTime(sleepTimer)}</span>}
            </button>
            <AnimatePresence>
              {showSleepMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-4 right-0 bg-[#282828] border border-[#3e3e3e] rounded-lg shadow-2xl p-1.5 w-32 flex flex-col gap-1"
                >
                  <div className="px-2 py-1.5 text-xs text-white font-bold border-b border-[#3e3e3e] mb-1">Sleep Timer</div>
                  {[15, 30, 45, 60].map(mins => (
                    <button
                      key={mins}
                      onClick={() => { setSleepTimer(mins * 60); setShowSleepMenu(false); }}
                      className="w-full text-left px-2 py-1.5 text-xs text-[#b3b3b3] hover:bg-[#3e3e3e] hover:text-white rounded-md transition-colors"
                    >
                      {mins} Minutes
                    </button>
                  ))}
                  <button
                    onClick={() => { setSleepTimer(null); setShowSleepMenu(false); }}
                    className="w-full text-left px-2 py-1.5 text-xs text-[#b3b3b3] hover:bg-[#3e3e3e] hover:text-white rounded-md transition-colors mt-1 border-t border-[#3e3e3e]"
                  >
                    Turn Off
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Volume Control */}
          <div className="flex items-center gap-2 w-[93px] group">
            <button onClick={() => setVolume && setVolume(currentVol === 0 ? 1 : 0)} className="text-[#b3b3b3] hover:text-white transition-colors">
              <VolumeIcon className="w-[18px] h-[18px]" />
            </button>
            <div className="relative flex items-center h-4 flex-1 cursor-pointer" ref={volumeBarRef} onMouseDown={handleVolumeDrag} onMouseMove={(e) => e.buttons === 1 && handleVolumeDrag(e)}>
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
                <div className="h-full bg-white group-hover:bg-[#1ed760] transition-colors" style={{ width: `${currentVol * 100}%` }} />
              </div>
              <div className="absolute w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity -ml-1.5" style={{ left: `${currentVol * 100}%` }} />
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};
