import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// Persistent Database path for Railway
const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'db.json');

// --- DATABASE HELPERS ---
const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], books: [], progress: [] }));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
};

const writeDB = (data: any) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// --- THE FIX 1: ADVANCED STORAGE ---
// This prevents Multer from stripping the file extensions (.aac, .mp3, .mp4).
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Extract the original extension and enforce it on the saved file
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// --- THE FIX 2: EXPLICIT MIME TYPES & CHUNKED STREAMING ---
// This forces Android hardware to recognize the file as high-fidelity music, routing to the loudspeaker.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  acceptRanges: true, // Crucial for mobile lock-screen streaming and chunking
  setHeaders: (res, filePath) => {
    res.setHeader('Accept-Ranges', 'bytes');
    
    const lowerPath = filePath.toLowerCase();
    if (lowerPath.endsWith('.aac')) {
      res.setHeader('Content-Type', 'audio/aac');
    } else if (lowerPath.endsWith('.m4a') || lowerPath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'audio/mp4');
    } else if (lowerPath.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else if (lowerPath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else {
      res.setHeader('Content-Type', 'application/octet-stream'); // Strict fallback
    }
  }
}));

// --- AUTHENTICATION ROUTES ---
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  
  if (db.users.find((u: any) => u.username === username)) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  
  // Zune19 gets automatic admin rights. Everyone else is a standard user.
  const role = username === 'zune19' ? 'admin' : 'user';
  const newUser = { id: crypto.randomUUID(), username, password, role };
  
  db.users.push(newUser);
  writeDB(db);
  res.json(newUser);
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find((u: any) => u.username === username && u.password === password);
  
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  res.json(user);
});

app.get('/api/me', (req, res) => {
  // Verifies the user via headers
  const username = req.headers.authorization?.split(' ')[1]; 
  const db = readDB();
  const user = db.users.find((u: any) => u.username === username);
  
  if (!user) return res.status(401).json({ message: 'Not logged in' });
  res.json(user);
});

// --- AUDIOBOOK CATALOG ROUTES ---
app.get('/api/books', (req, res) => {
  const db = readDB();
  res.json(db.books);
});

app.get('/api/books/:id', (req, res) => {
  const db = readDB();
  const book = db.books.find((b: any) => b.id === req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  res.json(book);
});

app.post('/api/books', upload.single('cover'), (req, res) => {
  const db = readDB();
  const { title, author, narrator, genre, description, coverUrl } = req.body;
  
  let finalCoverUrl = coverUrl || '';
  if (req.file) {
    finalCoverUrl = `/uploads/${req.file.filename}`;
  }

  const newBook = {
    id: crypto.randomUUID(),
    title, author, narrator, genre, description,
    coverUrl: finalCoverUrl,
    episodes: [],
    episodesCount: 0
  };
  
  db.books.push(newBook);
  writeDB(db);
  res.json(newBook);
});

app.delete('/api/books/:id', (req, res) => {
  const db = readDB();
  db.books = db.books.filter((b: any) => b.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// --- AUDIO UPLOAD ROUTES ---
app.post('/api/books/:bookId/episodes', upload.single('audio'), (req, res) => {
  const db = readDB();
  const bookIndex = db.books.findIndex((b: any) => b.id === req.params.bookId);
  if (bookIndex === -1) return res.status(404).json({ message: 'Book not found' });

  const { title, trackNumber, durationSeconds, audioUrl } = req.body;
  
  let finalAudioUrl = audioUrl || '';
  if (req.file) {
    finalAudioUrl = `/uploads/${req.file.filename}`;
  }

  const newEpisode = {
    id: crypto.randomUUID(),
    title: title || `Chapter ${db.books[bookIndex].episodes.length + 1}`,
    trackNumber: trackNumber ? parseInt(trackNumber) : db.books[bookIndex].episodes.length + 1,
    durationSeconds: durationSeconds ? parseInt(durationSeconds) : 0,
    audioUrl: finalAudioUrl
  };

  db.books[bookIndex].episodes.push(newEpisode);
  db.books[bookIndex].episodesCount = db.books[bookIndex].episodes.length;
  writeDB(db);
  res.json(newEpisode);
});

app.patch('/api/episodes/:id', (req, res) => {
  const db = readDB();
  const { durationSeconds } = req.body;
  let updated = false;
  
  db.books.forEach((book: any) => {
    const ep = book.episodes.find((e: any) => e.id === req.params.id);
    if (ep) {
      if (durationSeconds !== undefined) ep.durationSeconds = durationSeconds;
      updated = true;
    }
  });
  
  if (!updated) return res.status(404).json({ message: 'Episode not found' });
  writeDB(db);
  res.json({ success: true });
});

// --- USER PROGRESS ROUTES ---
app.post('/api/progress', (req, res) => {
  const db = readDB();
  const { episodeId, bookId, progress, duration, completed } = req.body;
  const username = req.headers.authorization?.split(' ')[1] || 'anonymous';
  
  let progEntry = db.progress.find((p: any) => p.episodeId === episodeId && p.username === username);
  if (progEntry) {
    progEntry.progress = progress;
    progEntry.duration = duration;
    progEntry.completed = completed;
  } else {
    db.progress.push({ id: crypto.randomUUID(), username, episodeId, bookId, progress, duration, completed });
  }
  
  writeDB(db);
  res.json({ success: true });
});

// --- SERVER INITIALIZATION ---
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Zuniobooks backend active on port ${port}`);
});
