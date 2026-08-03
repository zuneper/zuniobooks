import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Gauge,
  Moon,
  ListMusic,
  Heart,
  ChevronUp,
  X,
} from 'lucide-react';
import { useAudio, SLEEP_TIMER_OPTIONS } from '../context/AudioContext';
import { api } from '../lib/api';

const SPEED_OPTIONS = [0.5, 0.8, 1.0, 1.25, 1.5, 1.75, 2.0];

export const AudioPlayerBar: React.FC = () => {
  const {
    currentBook,
    currentEpisode,
    playlist,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    shuffle,
    repeatMode,
    sleepTimerLabel,
    playBook,
    playEpisode,
    togglePlayPause,
    seek,
    skipForward,
    skipBackward,
    playNextEpisode,
    playPreviousEpisode,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleShuffle,
    setRepeatMode,
    setSleepTimer,
  } = useAudio();

  const [showSpeedPopover, setShowSpeedPopover] = useState(false);
  const [showSleepPopover, setShowSleepPopover] = useState(false);
  const [showQueuePopover, setShowQueuePopover] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!currentBook || !currentEpisode) {
    return null; // Player appears as soon as user plays any episode/book
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleToggleFav = async () => {
    try {
      const res = await api.toggleFavorite(currentBook.id);
      setIsFavorite(res.isFavorite);
    } catch {
      // User might be guest
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#070418]/85 backdrop-blur-2xl border-t border-cyan-500/20 shadow-[0_-10px_40px_rgba(0,0,0,0.9)] px-3 py-2.5 sm:px-6 sm:py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-4">
        
        {/* Left Section: Cover & Book Info */}
        <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
          <img
            src={currentBook.coverUrl}
            alt={currentBook.title}
            className="w-12 h-12 rounded-lg object-cover shadow-lg border border-white/10 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">{currentBook.title}</h4>
            <p className="text-[11px] sm:text-xs text-cyan-300 font-medium truncate">{currentEpisode.title}</p>
            <p className="text-[10px] text-slate-400 truncate">{currentBook.author}</p>
          </div>
          <button
            onClick={handleToggleFav}
            className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors flex-shrink-0"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Center Section: Playback Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              title="Shuffle queue"
              className={`p-1.5 transition-colors ${shuffle ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            {/* Skip 15s Back */}
            <button
              onClick={() => skipBackward(15)}
              title="Skip 15 seconds back"
              className="p-1.5 text-slate-300 hover:text-cyan-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Previous Track */}
            <button
              onClick={playPreviousEpisode}
              title="Previous Chapter"
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause Toggle Button */}
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1px] shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 transition-transform"
            >
              <div className="w-full h-full bg-[#0d091f] hover:bg-[#150f33] rounded-full flex items-center justify-center transition-colors">
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-cyan-300 fill-cyan-300" />
                ) : (
                  <Play className="w-5 h-5 text-cyan-300 fill-cyan-300 ml-0.5" />
                )}
              </div>
            </button>

            {/* Next Track */}
            <button
              onClick={playNextEpisode}
              title="Next Chapter"
              className="p-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Skip 15s Forward */}
            <button
              onClick={() => skipForward(15)}
              title="Skip 15 seconds forward"
              className="p-1.5 text-slate-300 hover:text-cyan-300 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Repeat Mode */}
            <button
              onClick={() => {
                if (repeatMode === 'off') setRepeatMode('book');
                else if (repeatMode === 'book') setRepeatMode('episode');
                else setRepeatMode('off');
              }}
              title={`Repeat mode: ${repeatMode}`}
              className={`p-1.5 transition-colors ${
                repeatMode !== 'off' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {repeatMode === 'episode' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Timeline / Progress Scrubber */}
          <div className="flex items-center gap-2 w-full max-w-lg">
            <span className="text-[10px] text-slate-400 w-9 text-right font-mono">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all"
            />
            <span className="text-[10px] text-slate-400 w-9 font-mono">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Section: Speed, Sleep Timer, Queue & Volume */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 w-full md:w-1/4">
          
          {/* Speed Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSpeedPopover(!showSpeedPopover);
                setShowSleepPopover(false);
                setShowQueuePopover(false);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                playbackRate !== 1.0
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Playback speed"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{playbackRate}x</span>
            </button>

            {showSpeedPopover && (
              <div className="absolute bottom-10 right-0 z-50 w-28 p-1.5 bg-[#120d2b] border border-purple-500/30 rounded-xl shadow-2xl space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase border-b border-white/5">
                  Speed
                </div>
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowSpeedPopover(false);
                    }}
                    className={`w-full text-left px-2 py-1 text-xs rounded-lg transition-colors ${
                      playbackRate === rate
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sleep Timer */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSleepPopover(!showSleepPopover);
                setShowSpeedPopover(false);
                setShowQueuePopover(false);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                sleepTimerLabel !== 'Off'
                  ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Sleep timer"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{sleepTimerLabel}</span>
            </button>

            {showSleepPopover && (
              <div className="absolute bottom-10 right-0 z-50 w-36 p-1.5 bg-[#120d2b] border border-purple-500/30 rounded-xl shadow-2xl space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase border-b border-white/5">
                  Sleep Timer
                </div>
                {SLEEP_TIMER_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setSleepTimer(opt);
                      setShowSleepPopover(false);
                    }}
                    className={`w-full text-left px-2 py-1 text-xs rounded-lg transition-colors ${
                      sleepTimerLabel === opt.label ||
                      (opt.minutes === -1 && sleepTimerLabel === 'End of Episode') ||
                      (opt.minutes && sleepTimerLabel === `${opt.minutes}m`)
                        ? 'bg-purple-500/20 text-purple-300 font-bold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Queue Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowQueuePopover(!showQueuePopover);
                setShowSpeedPopover(false);
                setShowSleepPopover(false);
              }}
              className={`p-1.5 transition-colors ${
                showQueuePopover ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="View Queue / Episodes"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {showQueuePopover && (
              <div className="absolute bottom-12 right-0 z-50 w-80 max-h-80 overflow-y-auto p-3 bg-[#120d2b] border border-purple-500/30 rounded-2xl shadow-2xl space-y-2 custom-scrollbar">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Book Episodes</h4>
                  <button onClick={() => setShowQueuePopover(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {playlist.map((ep, idx) => {
                    const isCurrent = ep.id === currentEpisode.id;
                    return (
                      <div
                        key={ep.id}
                        onClick={() => {
                          playEpisode(currentBook, ep, playlist);
                          setShowQueuePopover(false);
                        }}
                        className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isCurrent
                            ? 'bg-gradient-to-r from-purple-900/50 to-cyan-900/40 text-cyan-300 font-bold border border-cyan-500/30'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate pr-2">
                          {idx + 1}. {ep.title}
                        </span>
                        {isCurrent && <span className="text-[10px] text-cyan-400 uppercase">Playing</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button onClick={toggleMute} className="p-1 text-slate-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-300" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 sm:w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

        </div>

      </div>
    </div>
  );
};
