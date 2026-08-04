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

  // Using HTMLVideoElement to force Android into Loudspeaker mode
  const audioRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedProgress = useRef<number>(0);

  useEffect(() => {
    const mediaNode = audioRef.current;
    if (!mediaNode) return;

    const updateTime = () => setProgress(mediaNode.currentTime);
    const updateDuration = () => setDuration(mediaNode.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    mediaNode.addEventListener('timeupdate', updateTime);
    mediaNode.addEventListener('loadedmetadata', updateDuration);
    mediaNode.addEventListener('play', handlePlay);
    mediaNode.addEventListener('pause', handlePause);

    return () => {
      mediaNode.removeEventListener('timeupdate', updateTime);
      mediaNode.removeEventListener('loadedmetadata', updateDuration);
      mediaNode.removeEventListener('play', handlePlay);
      mediaNode.removeEventListener('pause', handlePause);
    };
  }, []);

  const playEpisode = useCallback((book: Book, episode: Episode) => {
    setCurrentBook(book);
    setCurrentEpisode(episode);
    
    if (audioRef.current) {
      let fullUrl = episode.audioUrl.startsWith('http')
        ? episode.audioUrl
        : `${window.location.origin}${episode.audioUrl}`;
        
      // HIDE EXTENSION FROM ANDROID HEURISTIC:
      // By appending this query parameter, the phone's hardware doesn't see ".aac" at the end of the string.
      // It sees "media", forcing it to route to the main loudspeaker.
      fullUrl = fullUrl + (fullUrl.includes('?') ? '&' : '?') + 'stream=media';

      audioRef.current.src = fullUrl;
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate; 
      
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  }, [volume, playbackRate]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentBook && currentEpisode) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentEpisode.title,
        artist: currentBook.author,
        album: currentBook.title,
        artwork: [
          { src: currentBook.coverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: currentBook.coverUrl, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
      navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
      navigator.mediaSession.setActionHandler('seekbackward', () => seek(Math.max(0, (audioRef.current?.currentTime || 0) - 15)));
      navigator.mediaSession.setActionHandler('seekforward', () => seek(Math.min((audioRef.current?.duration || 0), (audioRef.current?.currentTime || 0) + 15)));
    }
  }, [currentBook, currentEpisode]);

  useEffect(() => {
    const mediaNode = audioRef.current;
    if (!mediaNode) return;

    mediaNode.onended = () => {
      setIsPlaying(false);
      if (currentBook && currentEpisode && currentBook.episodes) {
        const currentIndex = currentBook.episodes.findIndex(e => e.id === currentEpisode.id);
        if (currentIndex !== -1 && currentIndex < currentBook.episodes.length - 1) {
          const nextEpisode = currentBook.episodes[currentIndex + 1];
          setTimeout(() => { playEpisode(currentBook, nextEpisode); }, 500);
        }
      }
    };
  }, [currentBook, currentEpisode, playEpisode]);

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
      <video 
        ref={audioRef} 
        playsInline 
        preload="metadata"
        style={{ 
          position: 'fixed', 
          bottom: '-10px', 
          right: '-10px', 
          width: '1px', 
          height: '1px', 
          opacity: 0.01, 
          pointerEvents: 'none', 
          zIndex: -9999 
        }} 
      />
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};
