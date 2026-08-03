export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Episode {
  id: string;
  bookId: string;
  title: string;
  audioUrl: string;
  durationSeconds: number;
  trackNumber: number;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  narrator: string;
  genre: string;
  description: string;
  coverUrl: string;
  createdAt: string;
  updatedAt: string;
  episodesCount?: number;
  totalDurationSeconds?: number;
  episodes?: Episode[];
  isFavorite?: boolean;
}

export interface UserProgress {
  id: string;
  userId: string;
  episodeId: string;
  bookId: string;
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  lastPlayedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type RepeatMode = 'off' | 'episode' | 'book';

export interface SleepTimerOption {
  label: string;
  minutes: number | null; // null means disabled
  isEndOfChapter?: boolean;
}
