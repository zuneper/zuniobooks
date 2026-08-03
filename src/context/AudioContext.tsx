import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
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

  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const updateTime = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  // Auto-save progress to database every 10 seconds
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

  const playEpisode = (book: Book, episode: Episode) => {
    setCurrentBook(book);
    setCurrentEpisode(episode);
    if (audioRef.current) {
      const fullUrl = episode.audioUrl.startsWith('http')
        ? episode.audioUrl
        : `${window.location.origin}${episode.audioUrl}`;
      audioRef.current.src = fullUrl;
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentEpisode) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
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
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};
