import React, { useState, useEffect } from 'react';
import { Shield, PlusCircle, Upload, BookOpen, Music, Trash2, CheckCircle, AlertCircle, FolderPlus, Layers } from 'lucide-react';
import { Book, Episode, User } from '../types';
import { api } from '../lib/api';

interface AdminPortalProps {
  user: User | null;
  refreshBooks: () => void;
  preSelectedBookId?: string | null;
}

const GENRES = ['Sci-Fi', 'Cosmos', 'Fantasy', 'Mystery', 'Thriller', 'Business', 'Self-Help', 'Fiction', 'Non-Fiction', 'Classics'];

export const AdminPortal: React.FC<AdminPortalProps> = ({ user, refreshBooks, preSelectedBookId }) => {
  const [activeTab, setActiveTab] = useState<'create_book' | 'upload_episode' | 'manage'>('create_book');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookNarrator, setBookNarrator] = useState('');
  const [bookGenre, setBookGenre] = useState('Sci-Fi');
  const [bookDescription, setBookDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrlInput, setCoverUrlInput] = useState('');

  const [selectedBookId, setSelectedBookId] = useState(preSelectedBookId || '');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [episodeTrackNumber, setEpisodeTrackNumber] = useState('');
  const [episodeDurationInput, setEpisodeDurationInput] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrlInput, setAudioUrlInput] = useState('');

  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingEpisodes, setEditingEpisodes] = useState<Episode[]>([]);

  const fetchCatalog = async () => {
    try {
      const data = await api.getBooks();
      setBooks(data);
      if (data.length > 0 && !selectedBookId) setSelectedBookId(data[0].id);
    } catch {}
  };

  useEffect(() => {
    fetchCatalog();
    if (preSelectedBookId) {
      setSelectedBookId(preSelectedBookId);
      setActiveTab('upload_episode');
    }
  }, [preSelectedBookId]);

  if (!user || user.role !== 'admin') return null;

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle || !bookAuthor) return setStatusMessage({ type: 'error', msg: 'Title and Author required.' });
    try {
      setLoading(true); setStatusMessage(null);
      const formData = new FormData();
      formData.append('title', bookTitle); formData.append('author', bookAuthor);
      formData.append('narrator', bookNarrator || 'Unknown'); formData.append('genre', bookGenre);
      formData.append('description', bookDescription);
      if (coverFile) formData.append('cover', coverFile);
      else if (coverUrlInput) formData.append('coverUrl', coverUrlInput);

      const created = await api.createBook(formData);
      setStatusMessage({ type: 'success', msg: 'Audiobook created!' });
      setBookTitle(''); setBookAuthor(''); setBookNarrator(''); setBookDescription(''); setCoverFile(null); setCoverUrlInput('');
      fetchCatalog(); refreshBooks(); setSelectedBookId(created.id); setActiveTab('upload_episode');
    } catch (err: any) { setStatusMessage({ type: 'error', msg: err.message || 'Failed to create book' }); } 
    finally { setLoading(false); }
  };

  const handleUploadEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) return setStatusMessage({ type: 'error', msg: 'Select a book.' });
    if (!audioFile && !audioUrlInput) return setStatusMessage({ type: 'error', msg: 'Audio required.' });
    try {
      setLoading(true); setStatusMessage(null);
      const formData = new FormData();
      if (episodeTitle) formData.append('title', episodeTitle);
      if (episodeTrackNumber) formData.append('trackNumber', episodeTrackNumber);
      if (episodeDurationInput) formData.append('durationSeconds', episodeDurationInput);
      if (audioFile) formData.append('audio', audioFile);
      else if (audioUrlInput) formData.append('audioUrl', audioUrlInput);

      await api.createEpisode(selectedBookId, formData);
      setStatusMessage({ type: 'success', msg: 'Chapter uploaded!' });
      setEpisodeTitle(''); setEpisodeTrackNumber(''); setAudioFile(null); setAudioUrlInput(''); setEpisodeDurationInput('');
      fetchCatalog(); refreshBooks();
    } catch (err: any) { setStatusMessage({ type: 'error', msg: err.message || 'Failed to upload episode' }); } 
    finally { setLoading(false); }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm('Delete this book and all chapters?')) return;
    try {
      await api.deleteBook(bookId);
      setStatusMessage({ type: 'success', msg: 'Deleted.' });
      fetchCatalog(); refreshBooks();
    } catch (err: any) { setStatusMessage({ type: 'error', msg: err.message || 'Failed to delete' }); }
  };

  const handleManageEpisodes = async (bookId: string) => {
    if (editingBookId === bookId) return setEditingBookId(null);
    try {
      setLoading(true);
      const bookData = await api.getBook(bookId);
      setEditingEpisodes(bookData.episodes || []);
      setEditingBookId(bookId);
    } catch { setStatusMessage({ type: 'error', msg: 'Failed to load episodes.' }); } 
    finally { setLoading(false); }
  };

  const handleUpdateDuration = async (epId: string, newDuration: number) => {
    try {
      await api.updateEpisode(epId, { durationSeconds: newDuration });
      setEditingEpisodes((prev) => prev.map(e => e.id === epId ? { ...e, durationSeconds: newDuration } : e));
      refreshBooks();
    } catch {}
  };

  const inputClass = "w-full px-4 py-2.5 bg-[#282828] border border-[#3e3e3e] rounded-md text-sm text-white focus:outline-none focus:border-white transition-colors placeholder-[#a7a7a7]";
  const labelClass = "block text-xs font-bold text-[#b3b3b3] mb-1.5 uppercase tracking-wide";

  return (
    <div className="space-y-8 pb-28 max-w-[1000px] mx-auto pt-4">
      <div className="flex items-center justify-between pb-6 border-b border-[#282828]">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Admin Portal</h1>
          <p className="text-sm text-[#b3b3b3]">Manage your catalog and upload new content.</p>
        </div>
        <div className="px-3 py-1 bg-[#282828] rounded-full text-xs font-bold text-[#b3b3b3] border border-[#3e3e3e]">
          {books.length} Books
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-[#282828] pb-4">
        {[
          { id: 'create_book', icon: FolderPlus, label: '1. New Book' },
          { id: 'upload_episode', icon: Music, label: '2. Upload Audio' },
          { id: 'manage', icon: Layers, label: 'Catalog' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === tab.id ? 'bg-white text-black' : 'bg-[#181818] text-[#b3b3b3] hover:text-white hover:bg-[#282828]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {statusMessage && (
  <div className={`flex items-center gap-3 p-4 rounded-md text-sm font-bold ${statusMessage.type === 'success' ? 'bg-[#facc15]/10 text-[#facc15] border border-[#facc15]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{statusMessage.msg}</span>
        </div>
      )}

      {activeTab === 'create_book' && (
        <form onSubmit={handleCreateBook} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelClass}>Book Title *</label><input type="text" required value={bookTitle} onChange={e => setBookTitle(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Author *</label><input type="text" required value={bookAuthor} onChange={e => setBookAuthor(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Narrator</label><input type="text" value={bookNarrator} onChange={e => setBookNarrator(e.target.value)} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Genre</label>
              <select value={bookGenre} onChange={e => setBookGenre(e.target.value)} className={inputClass}>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div><label className={labelClass}>Description</label><textarea rows={3} value={bookDescription} onChange={e => setBookDescription(e.target.value)} className={inputClass} /></div>
          
          <div>
            <label className={labelClass}>Cover Image</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative border-2 border-dashed border-[#3e3e3e] hover:border-white rounded-md p-4 text-center cursor-pointer transition-colors bg-[#181818]">
                <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Upload className="w-5 h-5 text-[#b3b3b3] mx-auto mb-2" />
                <span className="text-xs font-bold text-white">{coverFile ? coverFile.name : 'Upload Image File'}</span>
              </div>
              <input type="url" value={coverUrlInput} onChange={e => setCoverUrlInput(e.target.value)} placeholder="Or paste image URL" className={inputClass} />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-fit px-8 py-3 rounded-full bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Audiobook'}
          </button>
        </form>
      )}

      {activeTab === 'upload_episode' && (
        <form onSubmit={handleUploadEpisode} className="space-y-6">
          <div>
            <label className={labelClass}>Select Audiobook *</label>
            <select value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)} className={inputClass}>
              {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className={labelClass}>Chapter Title</label><input type="text" value={episodeTitle} onChange={e => setEpisodeTitle(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Track Number</label><input type="number" value={episodeTrackNumber} onChange={e => setEpisodeTrackNumber(e.target.value)} placeholder="Auto if blank" className={inputClass} /></div>
            <div><label className={labelClass}>Duration (Secs)</label><input type="number" value={episodeDurationInput} onChange={e => setEpisodeDurationInput(e.target.value)} className={inputClass} /></div>
          </div>
          
          <div>
            <label className={labelClass}>Audio File *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative border-2 border-dashed border-[#1ed760]/30 hover:border-[#1ed760] rounded-md p-6 text-center cursor-pointer transition-colors bg-[#181818]">
                <input type="file" accept="audio/*" onChange={e => {
                  const file = e.target.files?.[0] || null; setAudioFile(file);
                  if (file) {
                    const objectUrl = URL.createObjectURL(file); const audio = new Audio(objectUrl);
                    audio.addEventListener('loadedmetadata', () => { if (audio.duration && !isNaN(audio.duration)) setEpisodeDurationInput(Math.round(audio.duration).toString()); URL.revokeObjectURL(objectUrl); });
                  }
                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Music className="w-6 h-6 text-[#1ed760] mx-auto mb-2" />
                <span className="text-xs font-bold text-white">{audioFile ? audioFile.name : 'Upload Audio'}</span>
              </div>
              <input type="url" value={audioUrlInput} onChange={e => setAudioUrlInput(e.target.value)} placeholder="Or paste direct audio URL" className={inputClass} />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-fit px-8 py-3 rounded-full bg-[#1ed760] text-black font-bold text-sm hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
            {loading ? 'Uploading...' : 'Upload Chapter'}
          </button>
        </form>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-4">
          {books.map(b => (
            <div key={b.id} className="p-4 rounded-md bg-[#181818] border border-[#282828]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={b.coverUrl} alt={b.title} className="w-12 h-12 rounded bg-[#282828] object-cover" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{b.title}</h4>
                    <p className="text-xs text-[#b3b3b3]">{b.author} • {b.episodesCount || 0} Chapters</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleManageEpisodes(b.id)} className="px-3 py-1.5 rounded-full bg-[#282828] text-white hover:bg-[#3e3e3e] text-xs font-bold transition-colors">Chapters</button>
                  <button onClick={() => handleDeleteBook(b.id)} className="p-1.5 text-[#b3b3b3] hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {editingBookId === b.id && (
                <div className="mt-4 pt-4 border-t border-[#282828] space-y-2">
                  {editingEpisodes.map(ep => (
                    <div key={ep.id} className="flex items-center justify-between p-2 rounded bg-[#282828]">
                      <span className="text-xs font-bold text-white truncate max-w-[50%]">{ep.title}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-[#b3b3b3] uppercase font-bold">Secs:</label>
                        <input 
                          type="number" defaultValue={ep.durationSeconds}
                          onBlur={e => { const val = parseInt(e.target.value, 10); if (!isNaN(val) && val !== ep.durationSeconds) handleUpdateDuration(ep.id, val); }}
                          className="w-16 px-2 py-1 bg-[#181818] border border-[#3e3e3e] rounded text-xs text-white text-center focus:outline-none focus:border-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
