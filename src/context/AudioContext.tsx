import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Book, Episode } from '../types';
import { api } from '../lib/api';

interface AudioContextType {
  currentBook: Book | null;
  currentEpisode: Episode | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  playbackRate: number;
  playEpisode: (book: Book, episode: Episode) => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  setPlaybackRate: (rate: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [playbackRate, setPlaybackRateState] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSavedProgress = useRef<number>(0);

  // Core event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    // Fallback sync with actual playback state
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const playEpisode = useCallback((book: Book, episode: Episode) => {
    setCurrentBook(book);
    setCurrentEpisode(episode);
    if (audioRef.current) {
      const fullUrl = episode.audioUrl.startsWith('http')
        ? episode.audioUrl
        : `${window.location.origin}${episode.audioUrl}`;
      audioRef.current.src = fullUrl;
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate; 
      
      // EXPLICIT LOAD: Forces the mobile browser to re-evaluate the media stream
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  }, [volume, playbackRate]);

  // 🚀 OS INTEGRATION: Hardware Media Session API
  // This forces Android into Loudspeaker mode (STREAM_MUSIC) and creates lock-screen controls
  useEffect(() => {
    if ('mediaSession' in navigator && currentBook && currentEpisode) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentEpisode.title,
        artist: currentBook.author,
        album: currentBook.title,
        artwork: [
          { src: currentBook.coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: currentBook.coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: currentBook.coverUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play().then(() => setIsPlaying(true)).catch(console.error);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
        }
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 15);
        }
      });
    }
  }, [currentBook, currentEpisode]);

  // Auto-Play Next Chapter
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.onended = () => {
      setIsPlaying(false);
      if (currentBook && currentEpisode && currentBook.episodes) {
        const currentIndex = currentBook.episodes.findIndex(e => e.id === currentEpisode.id);
        if (currentIndex !== -1 && currentIndex < currentBook.episodes.length - 1) {
          const nextEpisode = currentBook.episodes[currentIndex + 1];
          setTimeout(() => {
            playEpisode(currentBook, nextEpisode);
          }, 500);
        }
      }
    };
  }, [currentBook, currentEpisode, playEpisode]);

  // Auto-save progress
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && currentEpisode && currentBook && audioRef.current) {
        const currentPos = audioRef.current.currentTime;
        if (Math.abs(currentPos - lastSavedProgress.current) > 5) {
          api.saveProgress(currentEpisode.id, currentBook.id, currentPos, duration, false).catch(() => {});
          lastSavedProgress.current = currentPos;
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isPlaying, currentEpisode, currentBook, duration]);

  const togglePlayPause = () => {
    if (!audioRef.current || !currentEpisode) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const setVolume = (vol: number) => {
    if (audioRef.current) audioRef.current.volume = vol;
    setVolumeState(vol);
  };

  const setPlaybackRate = (rate: number) => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
    setPlaybackRateState(rate);
  };

  return (
    <AudioContext.Provider value={{
      currentBook, currentEpisode, isPlaying, progress, duration, volume, playbackRate,
      playEpisode, togglePlayPause, seek, setVolume, setPlaybackRate
    }}>
      {children}
      {/* 
        CRITICAL FIX FOR ANDROID EARPIECE BUG:
        1. playsInline forces media session instead of communication session.
        2. opacity: 0.01 instead of display: none ensures hardware acceleration engine recognizes it.
      */}
      <audio 
        ref={audioRef} 
        preload="metadata" 
        playsInline
        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0.01, pointerEvents: 'none', zIndex: -1 }} 
      />
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};
