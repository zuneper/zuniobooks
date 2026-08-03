import React, { useState, useEffect } from 'react';
import {
  Shield,
  PlusCircle,
  Upload,
  BookOpen,
  Music,
  Trash2,
  CheckCircle,
  AlertCircle,
  FolderPlus,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Book, Episode, User } from '../types';
import { api } from '../lib/api';

interface AdminPortalProps {
  user: User | null;
  refreshBooks: () => void;
  preSelectedBookId?: string | null;
}

const GENRES = [
  'Sci-Fi',
  'Cosmos',
  'Fantasy',
  'Mystery',
  'Thriller',
  'Business',
  'Self-Help',
  'Fiction',
  'Non-Fiction',
  'Classics',
];

export const AdminPortal: React.FC<AdminPortalProps> = ({
  user,
  refreshBooks,
  preSelectedBookId,
}) => {
  const [activeTab, setActiveTab] = useState<'create_book' | 'upload_episode' | 'manage'>('create_book');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Form State: New Book
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookNarrator, setBookNarrator] = useState('');
  const [bookGenre, setBookGenre] = useState('Sci-Fi');
  const [bookDescription, setBookDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrlInput, setCoverUrlInput] = useState('');

  // Form State: New Episode
  const [selectedBookId, setSelectedBookId] = useState(preSelectedBookId || '');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [episodeTrackNumber, setEpisodeTrackNumber] = useState('');
  const [episodeDurationInput, setEpisodeDurationInput] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrlInput, setAudioUrlInput] = useState('');

  // Form State: Episode Management
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingEpisodes, setEditingEpisodes] = useState<Episode[]>([]);

  const fetchCatalog = async () => {
    try {
      const data = await api.getBooks();
      setBooks(data);
      if (data.length > 0 && !selectedBookId) {
        setSelectedBookId(data[0].id);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCatalog();
    if (preSelectedBookId) {
      setSelectedBookId(preSelectedBookId);
      setActiveTab('upload_episode');
    }
  }, [preSelectedBookId]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-12 text-center rounded-3xl bg-rose-950/30 border border-rose-500/30 space-y-4 max-w-lg mx-auto">
        <Shield className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Admin Access Required</h2>
        <p className="text-sm text-slate-300">
          Only authorized admins can access content upload tools. Please log in with the admin credentials:
        </p>
        <div className="bg-black/50 p-3 rounded-xl text-xs font-mono text-cyan-300">
          Username: <span className="text-white font-bold">zune19</span> | Password:{' '}
          <span className="text-white font-bold">sampleacc@01</span>
        </div>
      </div>
    );
  }

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle || !bookAuthor) {
      setStatusMessage({ type: 'error', msg: 'Book Title and Author are required.' });
      return;
    }

    try {
      setLoading(true);
      setStatusMessage(null);

      const formData = new FormData();
      formData.append('title', bookTitle);
      formData.append('author', bookAuthor);
      formData.append('narrator', bookNarrator || 'Unknown Narrator');
      formData.append('genre', bookGenre);
      formData.append('description', bookDescription);

      if (coverFile) {
        formData.append('cover', coverFile);
      } else if (coverUrlInput) {
        formData.append('coverUrl', coverUrlInput);
      }

      const created = await api.createBook(formData);
      setStatusMessage({ type: 'success', msg: `Successfully created audiobook "${created.title}"!` });

      setBookTitle('');
      setBookAuthor('');
      setBookNarrator('');
      setBookDescription('');
      setCoverFile(null);
      setCoverUrlInput('');

      fetchCatalog();
      refreshBooks();

      setSelectedBookId(created.id);
      setActiveTab('upload_episode');
    } catch (err: any) {
      setStatusMessage({ type: 'error', msg: err.message || 'Failed to create book' });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) {
      setStatusMessage({ type: 'error', msg: 'Please select a book first.' });
      return;
    }

    if (!audioFile && !audioUrlInput) {
      setStatusMessage({ type: 'error', msg: 'Please upload an audio file or enter an audio URL.' });
      return;
    }

    try {
      setLoading(true);
      setStatusMessage(null);

      const formData = new FormData();
      if (episodeTitle) formData.append('title', episodeTitle);
      if (episodeTrackNumber) formData.append('trackNumber', episodeTrackNumber);
      if (episodeDurationInput) formData.append('durationSeconds', episodeDurationInput);

      if (audioFile) {
        formData.append('audio', audioFile);
      } else if (audioUrlInput) {
        formData.append('audioUrl', audioUrlInput);
      }

      const createdEp = await api.createEpisode(selectedBookId, formData);
      setStatusMessage({ type: 'success', msg: `Successfully uploaded episode "${createdEp.title}"!` });

      setEpisodeTitle('');
      setEpisodeTrackNumber('');
      setAudioFile(null);
      setAudioUrlInput('');
      setEpisodeDurationInput('');

      fetchCatalog();
      refreshBooks();
    } catch (err: any) {
      setStatusMessage({ type: 'error', msg: err.message || 'Failed to upload episode' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm('Are you sure you want to delete this book and all its chapters?')) return;
    try {
      await api.deleteBook(bookId);
      setStatusMessage({ type: 'success', msg: 'Audiobook deleted successfully.' });
      fetchCatalog();
      refreshBooks();
    } catch (err: any) {
      setStatusMessage({ type: 'error', msg: err.message || 'Failed to delete book' });
    }
  };

  const handleManageEpisodes = async (bookId: string) => {
    if (editingBookId === bookId) {
      setEditingBookId(null);
      return;
    }
    try {
      setLoading(true);
      const bookData = await api.getBook(bookId);
      setEditingEpisodes(bookData.episodes || []);
      setEditingBookId(bookId);
    } catch (err: any) {
      setStatusMessage({ type: 'error', msg: 'Failed to load episodes.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDuration = async (epId: string, newDuration: number) => {
    try {
      setStatusMessage(null);
      await api.updateEpisode(epId, { durationSeconds: newDuration });
      setStatusMessage({ type: 'success', msg: 'Duration updated successfully!' });
      setEditingEpisodes((prev) => prev.map(e => e.id === epId ? { ...e, durationSeconds: newDuration } : e));
      refreshBooks();
    } catch (err: any) {
      setStatusMessage({ type: 'error', msg: err.message || 'Failed to update duration' });
    }
  };

  const handleAutoFixDuration = (ep: Episode) => {
    setStatusMessage({ type: 'success', msg: 'Detecting duration...' });
    
    const fullUrl = ep.audioUrl.startsWith('http') 
      ? ep.audioUrl 
      : `${window.location.origin}${ep.audioUrl}`;
      
    const audio = new Audio(fullUrl);
    
    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && audio.duration !== Infinity && !isNaN(audio.duration)) {
        const exactSecs = Math.round(audio.duration);
        handleUpdateDuration(ep.id, exactSecs);
      } else {
        setStatusMessage({ type: 'error', msg: 'Browser could not auto-detect duration for this format. Please enter it manually.' });
      }
    });
    
    audio.addEventListener('error', () => {
      setStatusMessage({ type: 'error', msg: 'Failed to load audio for detection.' });
    });
  };

  return (
    <div className="space-y-6 pb-28 max-w-5xl mx-auto">
      {/* Admin Header Banner */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-cyan-950/60 border border-purple-500/30 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">Zuniobooks Admin Upload Portal</h1>
          </div>
          <p className="text-xs text-purple-200">
            Authenticated as <span className="font-bold text-white">{user.username}</span>. Create new audiobooks, upload audio chapter files, and manage catalog.
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1.5 rounded-full border border-cyan-500/30">
            {books.length} Books in Catalog
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('create_book')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'create_book'
              ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>1. Create New Book</span>
        </button>

        <button
          onClick={() => setActiveTab('upload_episode')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'upload_episode'
              ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>2. Upload Chapter Audio</span>
        </button>

        <button
          onClick={() => setActiveTab('manage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'manage'
              ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Catalog Management</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {statusMessage && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{statusMessage.msg}</span>
        </div>
      )}

      {/* Tab 1: Create Book Form */}
      {activeTab === 'create_book' && (
        <form onSubmit={handleCreateBook} className="p-6 sm:p-8 rounded-3xl bg-[#0e0a22]/90 border border-white/10 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Audiobook Metadata</span>
            </h2>
            <p className="text-xs text-slate-400">Add title, author, genre, and cover artwork.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Book Title *</label>
              <input
                type="text"
                required
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="e.g. Beyond the Starlight"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Author Name *</label>
              <input
                type="text"
                required
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                placeholder="e.g. Arthur Vance"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Narrator</label>
              <input
                type="text"
                value={bookNarrator}
                onChange={(e) => setBookNarrator(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Category / Genre</label>
              <select
                value={bookGenre}
                onChange={(e) => setBookGenre(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#120e29] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={bookDescription}
              onChange={(e) => setBookDescription(e.target.value)}
              placeholder="Enter audiobook plot summary or synopsis..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">Cover Art Image (Upload File or Enter Image URL)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-white/5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                <span className="text-xs font-semibold text-slate-200">
                  {coverFile ? coverFile.name : 'Click to Upload Cover Image'}
                </span>
              </div>

              <div>
                <input
                  type="url"
                  value={coverUrlInput}
                  onChange={(e) => setCoverUrlInput(e.target.value)}
                  placeholder="Or paste cover image URL..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
          >
            {loading ? 'Creating Audiobook...' : 'Create Audiobook & Proceed to Chapters'}
          </button>
        </form>
      )}

      {/* Tab 2: Upload Chapter Audio */}
      {activeTab === 'upload_episode' && (
        <form onSubmit={handleUploadEpisode} className="p-6 sm:p-8 rounded-3xl bg-[#0e0a22]/90 border border-white/10 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Music className="w-4 h-4 text-cyan-400" />
              <span>Upload Audio Chapter Segment</span>
            </h2>
            <p className="text-xs text-slate-400">Select an existing audiobook and upload any valid audio file format.</p>
          </div>

          {books.length === 0 ? (
            <p className="text-xs text-rose-400">No books found. Create an audiobook first in Step 1.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Select Target Audiobook *</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#120e29] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} (by {b.author})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Chapter Title</label>
                  <input
                    type="text"
                    value={episodeTitle}
                    onChange={(e) => setEpisodeTitle(e.target.value)}
                    placeholder="e.g. Chapter 1"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Track Number</label>
                  <input
                    type="number"
                    value={episodeTrackNumber}
                    onChange={(e) => setEpisodeTrackNumber(e.target.value)}
                    placeholder="Auto if blank"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    value={episodeDurationInput}
                    onChange={(e) => setEpisodeDurationInput(e.target.value)}
                    placeholder="e.g. 568"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">Audio Chapter File *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-cyan-950/20">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setAudioFile(file);
                        if (file) {
                          const objectUrl = URL.createObjectURL(file);
                          const audio = new Audio(objectUrl);
                          audio.addEventListener('loadedmetadata', () => {
                            if (audio.duration && audio.duration !== Infinity && !isNaN(audio.duration)) {
                              setEpisodeDurationInput(Math.round(audio.duration).toString());
                            }
                            URL.revokeObjectURL(objectUrl);
                          });
                        } else {
                          setEpisodeDurationInput('');
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <span className="text-xs font-bold text-white block">
                      {audioFile ? audioFile.name : 'Click to Upload Audio File'}
                    </span>
                  </div>

                  <div>
                    <input
                      type="url"
                      value={audioUrlInput}
                      onChange={(e) => {
                        const url = e.target.value;
                        setAudioUrlInput(url);
                        if (url) {
                          const audio = new Audio(url);
                          audio.addEventListener('loadedmetadata', () => {
                            if (audio.duration && audio.duration !== Infinity && !isNaN(audio.duration)) {
                              setEpisodeDurationInput(Math.round(audio.duration).toString());
                            }
                          });
                        } else {
                          setEpisodeDurationInput('');
                        }
                      }}
                      placeholder="Or paste direct audio stream URL..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
              >
                {loading ? 'Uploading Audio File...' : 'Upload Chapter Segment'}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Tab 3: Catalog Management */}
      {activeTab === 'manage' && (
        <div className="p-6 rounded-3xl bg-[#0e0a22]/90 border border-white/10 space-y-4 shadow-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Existing Audiobooks Catalog ({books.length})</span>
          </h2>

          {books.length === 0 ? (
            <p className="text-xs text-slate-400">No books created yet.</p>
          ) : (
            <div className="space-y-3">
              {books.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col p-3.5 rounded-2xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={b.coverUrl} alt={b.title} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <h4 className="text-sm font-bold text-white">{b.title}</h4>
                        <p className="text-xs text-slate-400">
                          {b.author} • {b.episodesCount || 0} Chapters • {b.genre}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleManageEpisodes(b.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-900/60 transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Chapters</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedBookId(b.id);
                          setActiveTab('upload_episode');
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-900/60 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add</span>
                      </button>

                      <button
                        onClick={() => handleDeleteBook(b.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Audiobook"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Chapters Dropdown / Editor */}
                  {editingBookId === b.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                      <h5 className="text-xs font-bold text-white mb-2">Edit Chapters for {b.title}</h5>
                      
                      {editingEpisodes.length === 0 ? (
                        <p className="text-xs text-slate-500">No chapters found for this audiobook.</p>
                      ) : (
                        editingEpisodes.map((ep) => (
                          <div key={ep.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-black/20 border border-white/5">
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-xs font-bold text-slate-200 truncate">{ep.title}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Current Duration: {Math.floor(ep.durationSeconds / 60)}m {Math.floor(ep.durationSeconds % 60)}s ({ep.durationSeconds}s)
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-slate-400">Secs:</label>
                                <input 
                                  type="number" 
                                  defaultValue={ep.durationSeconds}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val) && val !== ep.durationSeconds) {
                                      handleUpdateDuration(ep.id, val);
                                    }
                                  }}
                                  className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded-md text-xs text-white text-center focus:outline-none focus:border-cyan-400"
                                  title="Enter duration in seconds and click off to save"
                                />
                              </div>
                              <button
                                onClick={() => handleAutoFixDuration(ep)}
                                className="w-auto px-3 py-1.5 rounded-md bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 border border-purple-500/30 text-[10px] font-bold transition-colors whitespace-nowrap"
                              >
                                Auto-Fix
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
