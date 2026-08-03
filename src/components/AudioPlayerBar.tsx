import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Volume2, VolumeX, Volume1,
  SkipBack, SkipForward, RotateCcw, RotateCw, Heart, Moon, ChevronDown
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
  const {
    currentBook, currentEpisode, isPlaying, progress, duration, volume, 
    playbackRate, togglePlayPause, setVolume, setPlaybackRate, seek
  } = useAudio();

  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const mobileProgressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  
  const desktopSpeedRef = useRef<HTMLDivElement>(null);
  const mobileSpeedRef = useRef<HTMLDivElement>(null);
  const desktopSleepRef = useRef<HTMLDivElement>(null);
  const mobileSleepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsFavorite(currentBook?.isFavorite || false);
  }, [currentBook]);

  // Handle both mouse and touch events safely to prevent menus from flickering shut
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      
      const clickedSpeed = desktopSpeedRef.current?.contains(target) || mobileSpeedRef.current?.contains(target);
      if (!clickedSpeed) setShowSpeedMenu(false);

      const clickedSleep = desktopSleepRef.current?.contains(target) || mobileSleepRef.current?.contains(target);
      if (!clickedSleep) setShowSleepMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (sleepTimer === null || !isPlaying) return;
    const interval = setInterval(() => {
      setSleepTimer(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          togglePlayPause();
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
    setIsFavorite(!isFavorite); 
    try {
      const res = await api.toggleFavorite(currentBook.id);
      setIsFavorite(res.isFavorite);
    } catch (err) {
      setIsFavorite(originalState);
    }
  };

  const handleProgressDrag = (e: React.MouseEvent | React.TouchEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current || !duration) return;
    const rect = ref.current.getBoundingClientRect();
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

  const handleVolumeDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setVolume(pos);
  };

  const skipForward15 = () => { if (duration) seek(Math.min((progress || 0) + 15, duration)); };
  const skipBackward15 = () => { seek(Math.max((progress || 0) - 15, 0)); };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const currentVol = volume ?? 1;

  // Alignment prop ensures mobile menus don't render off-screen
  const renderSpeedMenu = (ref: React.RefObject<HTMLDivElement>, alignmentClass: string) => (
    <div className="relative flex items-center" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); setShowSleepMenu(false); }}
        className={`text-[12px] font-bold px-2 py-1 rounded-md border ${playbackRate !== 1 ? 'border-[#1ed760] text-[#1ed760]' : 'border-[#b3b3b3] text-[#b3b3b3] hover:text-white hover:border-white'} transition-colors`}
      >
        {playbackRate}x
      </button>
      <AnimatePresence>
        {showSpeedMenu && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute bottom-full mb-4 ${alignmentClass} bg-[#282828] border border-[#3e3e3e] rounded-lg shadow-2xl p-1.5 w-24 flex flex-col gap-1 z-[110]`}
          >
            {[0.5, 0.8, 1, 1.2, 1.5, 2].map(speed => (
              <button
                key={speed}
                onClick={(e) => { e.stopPropagation(); setPlaybackRate(speed); setShowSpeedMenu(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${playbackRate === speed ? 'text-[#1ed760] font-bold bg-[#3e3e3e]' : 'text-[#b3b3b3] hover:bg-[#3e3e3e] hover:text-white'}`}
              >
                {speed}x
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderSleepMenu = (ref: React.RefObject<HTMLDivElement>, alignmentClass: string) => (
    <div className="relative flex items-center" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setShowSleepMenu(!showSleepMenu); setShowSpeedMenu(false); }}
        className={`flex items-center gap-1.5 transition-colors ${sleepTimer ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'}`}
      >
        <Moon className="w-5 h-5" />
        {sleepTimer && <span className="text-xs font-mono bg-[#3e3e3e] px-1.5 py-0.5 rounded">{formatTime(sleepTimer)}</span>}
      </button>
      <AnimatePresence>
        {showSleepMenu && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute bottom-full mb-4 ${alignmentClass} bg-[#282828] border border-[#3e3e3e] rounded-lg shadow-2xl p-1.5 w-32 flex flex-col gap-1 z-[110]`}
          >
            <div className="px-2 py-1.5 text-[11px] text-[#a7a7a7] uppercase tracking-wider font-bold border-b border-[#3e3e3e] mb-1">Sleep Timer</div>
            {[15, 30, 45, 60].map(mins => (
              <button
                key={mins}
                onClick={(e) => { e.stopPropagation(); setSleepTimer(mins * 60); setShowSleepMenu(false); }}
                className="w-full text-left px-2 py-1.5 text-xs text-[#b3b3b3] hover:bg-[#3e3e3e] hover:text-white rounded-md transition-colors"
              >
                {mins} Minutes
              </button>
            ))}
            <button
              onClick={(e) => { e.stopPropagation(); setSleepTimer(null); setShowSleepMenu(false); }}
              className="w-full text-left px-2 py-1.5 text-xs text-[#b3b3b3] hover:bg-[#3e3e3e] hover:text-white rounded-md transition-colors mt-1 border-t border-[#3e3e3e]"
            >
              Turn Off
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      {/* DESKTOP PLAYER */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="hidden md:flex fixed bottom-0 inset-x-0 z-50 bg-[#181818] border-t border-[#282828] h-[90px] items-center select-none"
      >
        <div className="flex items-center justify-between w-full px-6 max-w-[1600px] mx-auto h-full">
          {/* Desktop Left */}
          <div className="flex items-center gap-3.5 w-[30%] min-w-[180px] pr-4">
            <img src={currentBook.coverUrl} alt="Cover" className="w-14 h-14 rounded-md object-cover shadow-md bg-[#282828] flex-shrink-0" />
            <div className="flex flex-col min-w-0 w-full overflow-hidden justify-center">
              <SmartMarquee text={currentBook.title} className="text-[14px] font-normal text-white hover:underline cursor-pointer" threshold={25} />
              <SmartMarquee text={currentEpisode.title} className="text-[12px] text-[#b3b3b3] hover:text-white hover:underline cursor-pointer mt-0.5 transition-colors" threshold={30} />
            </div>
            <button 
              onClick={handleToggleFavorite}
              className={`${isFavorite ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'} transition-colors ml-2 active:scale-95 flex-shrink-0`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Desktop Center */}
          <div className="flex flex-col items-center justify-center w-[40%] max-w-[722px]">
            <div className="flex items-center gap-6 mb-2">
              <button onClick={skipBackward15} className="text-[#b3b3b3] hover:text-white active:scale-95"><RotateCcw className="w-4 h-4" /></button>
              <button className="text-[#4d4d4d] cursor-not-allowed"><SkipBack className="w-5 h-5 fill-current" /></button>
              <button onClick={togglePlayPause} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform active:scale-95 flex-shrink-0">
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-[1px]" />}
              </button>
              <button className="text-[#4d4d4d] cursor-not-allowed"><SkipForward className="w-5 h-5 fill-current" /></button>
              <button onClick={skipForward15} className="text-[#b3b3b3] hover:text-white active:scale-95"><RotateCw className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 w-full max-w-[600px]">
              <span className="text-[11px] text-[#a7a7a7] font-mono min-w-[40px] text-right">{formatTime(dragProgress)}</span>
              <div 
                className="relative flex items-center h-4 flex-1 cursor-pointer group"
                ref={progressBarRef}
                onMouseDown={(e) => { setIsDragging(true); handleProgressDrag(e, progressBarRef); }}
                onMouseMove={(e) => isDragging && handleProgressDrag(e, progressBarRef)}
                onMouseUp={handleProgressDragEnd}
                onMouseLeave={handleProgressDragEnd}
              >
                <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
                  <div className="h-full bg-white group-hover:bg-[#1ed760] transition-colors" style={{ width: `${(dragProgress / (duration || 1)) * 100}%` }} />
                </div>
                <div className="absolute w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity -ml-1.5" style={{ left: `${(dragProgress / (duration || 1)) * 100}%` }} />
              </div>
              <span className="text-[11px] text-[#a7a7a7] font-mono min-w-[40px]">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Desktop Right */}
          <div className="flex items-center justify-end w-[30%] min-w-[180px] gap-4">
            {renderSpeedMenu(desktopSpeedRef, 'right-0')}
            {renderSleepMenu(desktopSleepRef, 'right-0')}
            <div className="flex items-center gap-2 w-[93px] group">
              <button onClick={() => setVolume(currentVol === 0 ? 1 : 0)} className="text-[#b3b3b3] hover:text-white transition-colors">
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

      {/* MOBILE MINI PLAYER */}
      {!isMobileExpanded && (
        <motion.div 
          initial={{ y: 100 }} animate={{ y: 0 }}
          className="md:hidden fixed bottom-14 sm:bottom-0 inset-x-2 sm:inset-x-0 z-50 rounded-lg sm:rounded-none bg-[#2a2a2a] overflow-hidden cursor-pointer shadow-lg"
          onClick={() => setIsMobileExpanded(true)}
        >
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img src={currentBook.coverUrl} alt="Cover" className="w-10 h-10 rounded shadow-sm flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-white truncate">{currentBook.title}</span>
                <span className="text-[12px] text-[#b3b3b3] truncate">{currentEpisode.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-3">
              <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }} className={`${isFavorite ? 'text-[#1ed760]' : 'text-white'} p-2`}>
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="p-2 text-white">
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              </button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-[2px] bg-white/20 w-full">
            <div className="h-full bg-white rounded-r-full" style={{ width: `${(progress / (duration || 1)) * 100}%` }} />
          </div>
        </motion.div>
      )}

      {/* MOBILE FULLSCREEN PLAYER */}
      <AnimatePresence>
        {isMobileExpanded && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="md:hidden fixed inset-0 z-[100] bg-gradient-to-b from-[#2a2a2a] to-[#121212] flex flex-col p-6 text-white"
          >
            <div className="flex items-center justify-between mb-8 mt-2">
              <button onClick={() => setIsMobileExpanded(false)} className="p-2 text-white hover:text-gray-300"><ChevronDown className="w-7 h-7" /></button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] tracking-widest uppercase font-bold text-[#b3b3b3]">Now Playing</span>
                <span className="text-xs font-bold mt-0.5 truncate max-w-[200px]">{currentBook.title}</span>
              </div>
              <div className="w-11" />
            </div>

            <div className="flex-1 min-h-0 flex items-center justify-center mb-8">
              <img src={currentBook.coverUrl} alt="Cover" className="w-full max-w-[320px] aspect-square rounded-lg shadow-2xl object-cover" />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col min-w-0 flex-1 pr-4">
                <SmartMarquee text={currentBook.title} className="text-xl font-bold leading-relaxed mb-1" threshold={20} />
                <SmartMarquee text={currentEpisode.title} className="text-sm text-[#b3b3b3] leading-relaxed" threshold={25} />
              </div>
              <button onClick={handleToggleFavorite} className={`${isFavorite ? 'text-[#1ed760]' : 'text-white'}`}>
                <Heart className={`w-7 h-7 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="mb-8 w-full">
              <div 
                className="relative flex items-center h-6 cursor-pointer group"
                ref={mobileProgressBarRef}
                onTouchStart={(e) => { setIsDragging(true); handleProgressDrag(e, mobileProgressBarRef); }}
                onTouchMove={(e) => isDragging && handleProgressDrag(e, mobileProgressBarRef)}
                onTouchEnd={handleProgressDragEnd}
              >
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${(dragProgress / (duration || 1)) * 100}%` }} />
                </div>
                <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md -ml-1.5" style={{ left: `${(dragProgress / (duration || 1)) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[12px] font-mono text-[#a7a7a7]">{formatTime(dragProgress)}</span>
                <span className="text-[12px] font-mono text-[#a7a7a7]">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 mb-8">
              <button onClick={skipBackward15} className="text-white active:scale-90 transition-transform"><RotateCcw className="w-8 h-8" /></button>
              <button className="text-white/30 cursor-not-allowed"><SkipBack className="w-8 h-8 fill-current" /></button>
              <button onClick={togglePlayPause} className="w-[72px] h-[72px] flex items-center justify-center rounded-full bg-white text-black active:scale-95 transition-transform shadow-lg">
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current translate-x-1" />}
              </button>
              <button className="text-white/30 cursor-not-allowed"><SkipForward className="w-8 h-8 fill-current" /></button>
              <button onClick={skipForward15} className="text-white active:scale-90 transition-transform"><RotateCw className="w-8 h-8" /></button>
            </div>

            <div className="flex items-center justify-between pb-6">
              {/* Note the 'left-0' aligns the dropdown correctly on the mobile view */}
              {renderSpeedMenu(mobileSpeedRef, 'left-0')}
              {renderSleepMenu(mobileSleepRef, 'right-0')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
