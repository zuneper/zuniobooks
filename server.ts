import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { initDatabase, dbService, UserRecord } from './src/server/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'zuniobooks_galaxy_secret_key_2026';
const PORT = process.env.PORT || 3000;

// Respect Railway Persistent Volume variables
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const UPLOADS_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const COVERS_DIR = path.join(UPLOADS_DIR, 'covers');
const AUDIO_DIR = path.join(UPLOADS_DIR, 'audio');

[UPLOADS_DIR, COVERS_DIR, AUDIO_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') cb(null, AUDIO_DIR);
    else if (file.fieldname === 'cover') cb(null, COVERS_DIR);
    else cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 },
});

export interface AuthRequest extends Request {
  user?: UserRecord;
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (!err && decoded) {
      const user = dbService.findUserById(decoded.id);
      if (user) req.user = user;
    }
    next();
  });
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

async function startServer() {
  await initDatabase();
  
  // CRITICAL FIX: Safe file-system modification to force admin privileges, bypassing esbuild require() errors.
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const db = JSON.parse(raw);
      const adminIndex = db.users.findIndex((u: any) => u.username.toLowerCase() === 'zune19');
      if (adminIndex !== -1 && db.users[adminIndex].role !== 'admin') {
        db.users[adminIndex].role = 'admin';
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
        console.log('✅ FORCE UPGRADE: zune19 has been granted Admin privileges.');
      }
    } catch (e) {
      console.error('Failed to force upgrade admin:', e);
    }
  }

  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(authenticateToken);

  app.use('/uploads/covers', express.static(COVERS_DIR));

  app.get('/uploads/audio/:filename', (req, res) => {
    const filePath = path.join(AUDIO_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('Audio file not found');

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac',
      '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.flac': 'audio/flac', '.webm': 'audio/webm',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    }
  });

  app.get('/api/auth/check-user', (req: Request, res: Response) => {
    const identifier = ((req.query.identifier as string) || '').trim().toLowerCase();
    if (!identifier) return res.json({ exists: false });
    const user = dbService.findUserByUsername(identifier) || dbService.findUserByEmail(identifier);
    res.json({ exists: !!user, username: user ? user.username : null, role: user ? user.role : null });
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });
      if (dbService.findUserByUsername(username)) return res.status(400).json({ error: 'Username is already taken' });
      if (dbService.findUserByEmail(email)) return res.status(400).json({ error: 'Email is already registered' });

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const newUser: UserRecord = {
        id: `user_${Date.now()}`, username, email, passwordHash, role: 'user', createdAt: new Date().toISOString(),
      };

      dbService.createUser(newUser);
      const token = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, JWT_SECRET, { expiresIn: '30d' });
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      res.status(201).json({ token, user: userWithoutPassword });
    } catch (err: any) { res.status(500).json({ error: err.message || 'Registration failed' }); }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

      const user = dbService.findUserByUsername(username) || dbService.findUserByEmail(username);
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return res.status(400).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (err: any) { res.status(500).json({ error: err.message || 'Login failed' }); }
  });

  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const { passwordHash: _, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  });

  app.get('/api/books', (req: AuthRequest, res: Response) => {
    const q = ((req.query.q as string) || '').toLowerCase().trim();
    const genre = ((req.query.genre as string) || '').toLowerCase().trim();
    let books = dbService.getBooks();

    if (q) {
      books = books.filter((b) => {
        const inTitle = b.title.toLowerCase().includes(q);
        const inAuthor = b.author.toLowerCase().includes(q);
        const inGenre = b.genre.toLowerCase().includes(q);
        return inTitle || inAuthor || inGenre;
      });
    }

    if (genre && genre !== 'all') books = books.filter((b) => b.genre.toLowerCase() === genre);

    const favorites = req.user ? dbService.getUserFavoriteBookIds(req.user.id) : [];
    const enrichedBooks = books.map((b) => {
      const episodes = dbService.getEpisodesByBookId(b.id);
      const totalDurationSeconds = episodes.reduce((acc, ep) => acc + (ep.durationSeconds || 0), 0);
      return { ...b, episodesCount: episodes.length, totalDurationSeconds, isFavorite: favorites.includes(b.id) };
    });
    res.json(enrichedBooks);
  });

  app.get('/api/books/:id', (req: AuthRequest, res: Response) => {
    const book = dbService.getBookById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const episodes = dbService.getEpisodesByBookId(book.id);
    const totalDurationSeconds = episodes.reduce((acc, ep) => acc + (ep.durationSeconds || 0), 0);
    const favorites = req.user ? dbService.getUserFavoriteBookIds(req.user.id) : [];

    res.json({ ...book, episodesCount: episodes.length, totalDurationSeconds, episodes, isFavorite: favorites.includes(book.id) });
  });

  app.post('/api/books', requireAdmin, upload.single('cover'), (req: AuthRequest, res: Response) => {
    try {
      const { title, author, narrator, genre, description, coverUrl: customCoverUrl } = req.body;
      if (!title || !author) return res.status(400).json({ error: 'Title and author are required' });

      let coverUrl = customCoverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop';
      if (req.file) coverUrl = `/uploads/covers/${req.file.filename}`;

      const newBook = dbService.createBook({
        id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title, author: author || 'Unknown Author', narrator: narrator || 'Unknown Narrator',
        genre: genre || 'Audiobook', description: description || '', coverUrl,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      res.status(201).json(newBook);
    } catch (err: any) { res.status(500).json({ error: err.message || 'Failed to create book' }); }
  });

  app.delete('/api/books/:id', requireAdmin, (req: AuthRequest, res: Response) => {
    const book = dbService.getBookById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    if (book.coverUrl.startsWith('/uploads/')) {
      const coverPath = path.join(process.cwd(), book.coverUrl);
      if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
    }
    
    const episodes = dbService.getEpisodesByBookId(book.id);
    episodes.forEach(ep => {
      if (ep.audioUrl.startsWith('/uploads/')) {
        const audioPath = path.join(process.cwd(), ep.audioUrl);
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      }
    });

    dbService.deleteBook(req.params.id);
    res.json({ message: 'Book and associated files deleted successfully' });
  });

  app.post('/api/books/:bookId/episodes', requireAdmin, upload.single('audio'), (req: AuthRequest, res: Response) => {
    try {
      const { bookId } = req.params;
      const { title, durationSeconds, trackNumber, audioUrl: customAudioUrl } = req.body;
      const book = dbService.getBookById(bookId);
      if (!book) return res.status(404).json({ error: 'Book not found' });

      let audioUrl = customAudioUrl;
      if (req.file) audioUrl = `/uploads/audio/${req.file.filename}`;
      if (!audioUrl) return res.status(400).json({ error: 'Audio file or audio URL is required' });

      const existingEpisodes = dbService.getEpisodesByBookId(bookId);
      const nextTrackNumber = trackNumber ? parseInt(trackNumber, 10) : existingEpisodes.length + 1;

      const newEpisode = dbService.createEpisode({
        id: `ep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        bookId, title: title || `Chapter ${nextTrackNumber}`, audioUrl,
        durationSeconds: durationSeconds ? parseFloat(durationSeconds) : 300,
        trackNumber: nextTrackNumber, createdAt: new Date().toISOString(),
      });
      res.status(201).json(newEpisode);
    } catch (err: any) { res.status(500).json({ error: err.message || 'Failed to create episode' }); }
  });

  app.delete('/api/episodes/:id', requireAdmin, (req: AuthRequest, res: Response) => {
    const episode = dbService.getEpisodeById(req.params.id);
    if (!episode) return res.status(404).json({ error: 'Episode not found' });

    if (episode.audioUrl.startsWith('/uploads/')) {
      const audioPath = path.join(process.cwd(), episode.audioUrl);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    }

    dbService.deleteEpisode(req.params.id);
    res.json({ message: 'Episode deleted successfully' });
  });

  app.post('/api/favorites/:bookId', requireAuth, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Auth required' });
    const isFavorite = dbService.toggleFavorite(req.user.id, req.params.bookId);
    res.json({ bookId: req.params.bookId, isFavorite });
  });

  app.get('/api/favorites', requireAuth, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Auth required' });
    const favIds = dbService.getUserFavoriteBookIds(req.user.id);
    const books = dbService.getBooks().filter((b) => favIds.includes(b.id)).map((b) => {
      const episodes = dbService.getEpisodesByBookId(b.id);
      return { ...b, episodesCount: episodes.length, totalDurationSeconds: episodes.reduce((acc, e) => acc + e.durationSeconds, 0), isFavorite: true };
    });
    res.json(books);
  });

  app.post('/api/progress', requireAuth, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Auth required' });
    const { episodeId, bookId, positionSeconds, durationSeconds, completed } = req.body;
    const prog = dbService.saveProgress(req.user.id, episodeId, bookId, positionSeconds || 0, durationSeconds || 0, !!completed);
    res.json(prog);
  });

  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error); next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => { console.log(`🚀 Zuniobooks server active on http://0.0.0.0:${PORT}`); });
}

startServer();
