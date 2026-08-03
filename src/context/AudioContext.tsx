import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Book, Episode, RepeatMode, SleepTimerOption, UserProgress } from '../types';
import { api } from '../lib/api';

export const SLEEP_TIMER_OPTIONS: SleepTimerOption[] = [
  { label: 'Off', minutes: null },
  { label: '5 Minutes', minutes: 5 },
  { label: '15 Minutes', minutes: 15 },
  { label: '30 Minutes', minutes: 30 },
  { label: '45 Minutes', minutes: 45 },
  { label: '60 Minutes', minutes: 60 },
  { label: 'End of Episode', minutes: -1, isEndOfChapter: true },
];

interface AudioContextType {
  currentBook: Book | null;
  currentEpisode: Episode | null;
  playlist: Episode[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  sleepTimerMinutes: number | null;
  sleepTimerEndsAt: number | null;
  sleepTimerLabel: string;
  progressMap: Record<string, UserProgress>; // episodeId -> UserProgress
  playBook: (book: Book, startEpisodeId?: string) => void;
  playEpisode: (book: Book, episode: Episode, playlist?: Episode[]) => void;
  togglePlayPause: () => void;
  seek: (seconds: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  playNextEpisode: () => void;
  playPreviousEpisode: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setSleepTimer: (option: SleepTimerOption) => void;
  refreshProgress: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [playlist, setPlaylist] = useState<Episode[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(1.0);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');

  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = useState<number | null>(null);
  const [sleepTimerLabel, setSleepTimerLabel] = useState<string>('Off');
  const sleepTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>({});

  // Initialize single persistent HTMLAudioElement
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Update MediaSession position state if available
      if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession && audio.duration) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration || 0,
            playbackRate: audio.playbackRate || 1.0,
            position: audio.currentTime || 0,
          });
        } catch {
          // ignore potential invalid position state errors
        }
      }
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      handleEpisodeEnded();
    };

    const handleError = (e: any) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  // Fetch initial playback progress
  const refreshProgress = async () => {
    try {
      const list = await api.getProgress();
      const map: Record<string, UserProgress> = {};
      list.forEach((p) => {
        map[p.episodeId] = p;
      });
      setProgressMap(map);
    } catch {
      // User might be guest
    }
  };

  useEffect(() => {
    refreshProgress();
  }, []);

  // Periodically save user playback position to backend
  useEffect(() => {
    if (!currentEpisode || !currentBook || !isPlaying) return;

    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        const pos = audioRef.current.currentTime;
        const dur = audioRef.current.duration || 0;
        if (pos > 0) {
          api.saveProgress(currentEpisode.id, currentBook.id, pos, dur, pos / dur > 0.95).catch(() => {});
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentEpisode, currentBook, isPlaying]);

  // Handle Media Session API setup
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (currentEpisode && currentBook) {
      const absoluteCoverUrl = currentBook.coverUrl.startsWith('http')
        ? currentBook.coverUrl
        : `${window.location.origin}${currentBook.coverUrl}`;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentEpisode.title,
        artist: currentBook.author,
        album: currentBook.title,
        artwork: [
          { src: absoluteCoverUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: absoluteCoverUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: absoluteCoverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: absoluteCoverUrl, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPreviousEpisode();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNextEpisode();
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        skipBackward(details.seekOffset || 15);
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        skipForward(details.seekOffset || 15);
      });

      try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined && details.seekTime !== null) {
            seek(details.seekTime);
          }
        });
      } catch {
        // seekto not supported in some browsers
      }
    }
  }, [currentEpisode, currentBook, playlist, currentIndex]);

  // Keep playbackState updated in MediaSession
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Handle Sleep Timer tick
  useEffect(() => {
    if (sleepTimerEndsAt) {
      sleepTimerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        if (now >= sleepTimerEndsAt) {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
          setSleepTimerMinutes(null);
          setSleepTimerEndsAt(null);
          setSleepTimerLabel('Off');
          if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
        }
      }, 1000);
    } else {
      if (sleepTimerIntervalRef.current) {
        clearInterval(sleepTimerIntervalRef.current);
      }
    }

    return () => {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
    };
  }, [sleepTimerEndsAt]);

  const handleEpisodeEnded = () => {
    if (sleepTimerLabel === 'End of Episode') {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setSleepTimerMinutes(null);
      setSleepTimerEndsAt(null);
      setSleepTimerLabel('Off');
      return;
    }

    if (repeatMode === 'episode') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      playNextEpisode();
    }
  };

  const playEpisode = (book: Book, episode: Episode, customPlaylist?: Episode[]) => {
    const list = customPlaylist || book.episodes || [episode];
    const index = list.findIndex((e) => e.id === episode.id);

    setCurrentBook(book);
    setCurrentEpisode(episode);
    setPlaylist(list);
    setCurrentIndex(index >= 0 ? index : 0);

    if (audioRef.current) {
      const fullUrl = episode.audioUrl.startsWith('http')
        ? episode.audioUrl
        : `${window.location.origin}${episode.audioUrl}`;

      audioRef.current.src = fullUrl;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;

      // Check if user has saved position
      const savedProg = progressMap[episode.id];
      if (savedProg && savedProg.positionSeconds > 0 && !savedProg.completed) {
        audioRef.current.currentTime = savedProg.positionSeconds;
      } else {
        audioRef.current.currentTime = 0;
      }

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Play failed:', err);
          setIsPlaying(false);
        });
    }
  };

  const playBook = (book: Book, startEpisodeId?: string) => {
    const episodes = book.episodes || [];
    if (episodes.length === 0) return;

    let target = episodes[0];
    if (startEpisodeId) {
      const found = episodes.find((e) => e.id === startEpisodeId);
      if (found) target = found;
    } else {
      // Find first incomplete episode if any
      const incomplete = episodes.find((e) => progressMap[e.id] && !progressMap[e.id].completed);
      if (incomplete) target = incomplete;
    }

    playEpisode(book, target, episodes);
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentEpisode) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      // Save progress on pause
      api.saveProgress(
        currentEpisode.id,
        currentBook!.id,
        audioRef.current.currentTime,
        audioRef.current.duration || 0
      ).catch(() => {});
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error(e));
    }
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const skipForward = (seconds = 15) => {
    if (audioRef.current) {
      const nextTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + seconds);
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const skipBackward = (seconds = 15) => {
    if (audioRef.current) {
      const nextTime = Math.max(0, audioRef.current.currentTime - seconds);
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const playNextEpisode = () => {
    if (!playlist || playlist.length === 0) return;

    let nextIndex = currentIndex + 1;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    }

    if (nextIndex >= playlist.length) {
      if (repeatMode === 'book') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    const nextEpisode = playlist[nextIndex];
    if (currentBook && nextEpisode) {
      playEpisode(currentBook, nextEpisode, playlist);
    }
  };

  const playPreviousEpisode = () => {
    if (!playlist || playlist.length === 0) return;

    // If currentTime > 3s, restart current episode
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (repeatMode === 'book') {
        prevIndex = playlist.length - 1;
      } else {
        prevIndex = 0;
      }
    }

    const prevEpisode = playlist[prevIndex];
    if (currentBook && prevEpisode) {
      playEpisode(currentBook, prevEpisode, playlist);
    }
  };

  const setVolume = (vol: number) => {
    setVolumeState(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume || 0.8;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleShuffle = () => {
    setShuffle(!shuffle);
  };

  const setSleepTimer = (option: SleepTimerOption) => {
    if (option.minutes === null) {
      setSleepTimerMinutes(null);
      setSleepTimerEndsAt(null);
      setSleepTimerLabel('Off');
    } else if (option.isEndOfChapter) {
      setSleepTimerMinutes(-1);
      setSleepTimerEndsAt(null);
      setSleepTimerLabel('End of Episode');
    } else {
      const endsAt = Date.now() + option.minutes * 60 * 1000;
      setSleepTimerMinutes(option.minutes);
      setSleepTimerEndsAt(endsAt);
      setSleepTimerLabel(`${option.minutes}m`);
    }
  };

  return (
    <AudioContext.Provider
      value={{
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
        sleepTimerMinutes,
        sleepTimerEndsAt,
        sleepTimerLabel,
        progressMap,
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
        refreshProgress,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
