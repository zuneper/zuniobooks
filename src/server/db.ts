import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Respect Railway Persistent Volume variables if set, fallback to local path
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const UPLOADS_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const AUDIO_UPLOADS_DIR = path.join(UPLOADS_DIR, 'audio');
const COVERS_UPLOADS_DIR = path.join(UPLOADS_DIR, 'covers');

// Ensure directories exist
[DATA_DIR, UPLOADS_DIR, AUDIO_UPLOADS_DIR, COVERS_UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface BookRecord {
  id: string;
  title: string;
  author: string;
  narrator: string;
  genre: string;
  description: string;
  coverUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeRecord {
  id: string;
  bookId: string;
  title: string;
  audioUrl: string;
  durationSeconds: number;
  trackNumber: number;
  createdAt: string;
}

export interface FavoriteRecord {
  userId: string;
  bookId: string;
  createdAt: string;
}

export interface ProgressRecord {
  userId: string;
  episodeId: string;
  bookId: string;
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  lastPlayedAt: string;
}

interface DBData {
  users: UserRecord[];
  books: BookRecord[];
  episodes: EpisodeRecord[];
  favorites: FavoriteRecord[];
  progress: ProgressRecord[];
}

function loadDB(): DBData {
  if (!fs.existsSync(DB_FILE)) {
    const initialData: DBData = {
      users: [],
      books: [],
      episodes: [],
      favorites: [],
      progress: [],
    };
    saveDB(initialData);
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read db.json, reinitializing:', err);
    return { users: [], books: [], episodes: [], favorites: [], progress: [] };
  }
}

function saveDB(data: DBData) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Seed admin user on start if not present
export async function initDatabase() {
  const db = loadDB();
  const adminUsername = 'zune19';
  const adminExists = db.users.some((u) => u.username.toLowerCase() === adminUsername.toLowerCase());

  if (!adminExists) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('sampleacc@01', salt);
    const adminUser: UserRecord = {
      id: 'admin_zune19',
      username: 'zune19',
      email: 'admin@zuniobooks.com',
      passwordHash,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    db.users.push(adminUser);
    saveDB(db);
    console.log('✅ Initialized default Admin account (username: zune19)');
  }
}

export const dbService = {
  // User operations
  findUserByUsername(username: string): UserRecord | undefined {
    const db = loadDB();
    return db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  },
  findUserByEmail(email: string): UserRecord | undefined {
    const db = loadDB();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById(id: string): UserRecord | undefined {
    const db = loadDB();
    return db.users.find((u) => u.id === id);
  },
  createUser(user: UserRecord): UserRecord {
    const db = loadDB();
    db.users.push(user);
    saveDB(db);
    return user;
  },

  // Books operations
  getBooks(): BookRecord[] {
    const db = loadDB();
    return db.books;
  },
  getBookById(id: string): BookRecord | undefined {
    const db = loadDB();
    return db.books.find((b) => b.id === id);
  },
  createBook(book: BookRecord): BookRecord {
    const db = loadDB();
    db.books.unshift(book);
    saveDB(db);
    return book;
  },
  updateBook(id: string, updates: Partial<BookRecord>): BookRecord | undefined {
    const db = loadDB();
    const idx = db.books.findIndex((b) => b.id === id);
    if (idx === -1) return undefined;
    db.books[idx] = { ...db.books[idx], ...updates, updatedAt: new Date().toISOString() };
    saveDB(db);
    return db.books[idx];
  },
  deleteBook(id: string): boolean {
    const db = loadDB();
    const bookIdx = db.books.findIndex((b) => b.id === id);
    if (bookIdx === -1) return false;
    db.books.splice(bookIdx, 1);
    db.episodes = db.episodes.filter((e) => e.bookId !== id);
    db.favorites = db.favorites.filter((f) => f.bookId !== id);
    saveDB(db);
    return true;
  },

  // Episodes operations
  getEpisodesByBookId(bookId: string): EpisodeRecord[] {
    const db = loadDB();
    return db.episodes
      .filter((e) => e.bookId === bookId)
      .sort((a, b) => a.trackNumber - b.trackNumber);
  },
  getEpisodeById(id: string): EpisodeRecord | undefined {
    const db = loadDB();
    return db.episodes.find((e) => e.id === id);
  },
  createEpisode(episode: EpisodeRecord): EpisodeRecord {
    const db = loadDB();
    db.episodes.push(episode);
    saveDB(db);
    return episode;
  },
  updateEpisode(id: string, updates: Partial<EpisodeRecord>): EpisodeRecord | undefined {
    const db = loadDB();
    const idx = db.episodes.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    db.episodes[idx] = { ...db.episodes[idx], ...updates };
    saveDB(db);
    return db.episodes[idx];
  },
  deleteEpisode(id: string): boolean {
    const db = loadDB();
    const idx = db.episodes.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    db.episodes.splice(idx, 1);
    saveDB(db);
    return true;
  },

  // Favorites operations
  toggleFavorite(userId: string, bookId: string): boolean {
    const db = loadDB();
    const idx = db.favorites.findIndex((f) => f.userId === userId && f.bookId === bookId);
    if (idx !== -1) {
      db.favorites.splice(idx, 1);
      saveDB(db);
      return false;
    } else {
      db.favorites.push({ userId, bookId, createdAt: new Date().toISOString() });
      saveDB(db);
      return true;
    }
  },
  getUserFavoriteBookIds(userId: string): string[] {
    const db = loadDB();
    return db.favorites.filter((f) => f.userId === userId).map((f) => f.bookId);
  },

  // Progress operations
  saveProgress(
    userId: string,
    episodeId: string,
    bookId: string,
    positionSeconds: number,
    durationSeconds: number,
    completed: boolean
  ): ProgressRecord {
    const db = loadDB();
    const idx = db.progress.findIndex((p) => p.userId === userId && p.episodeId === episodeId);
    const rec: ProgressRecord = {
      userId,
      episodeId,
      bookId,
      positionSeconds,
      durationSeconds,
      completed,
      lastPlayedAt: new Date().toISOString(),
    };
    if (idx !== -1) {
      db.progress[idx] = rec;
    } else {
      db.progress.push(rec);
    }
    saveDB(db);
    return rec;
  },
  getUserProgress(userId: string): ProgressRecord[] {
    const db = loadDB();
    return db.progress.filter((p) => p.userId === userId);
  },
};
