import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, PlusCircle, Upload, BookOpen, Music, Trash2, CheckCircle, AlertCircle, ArrowLeft, Layers, Clock } from 'lucide-react';
import { Book, Episode, User } from '../types';
import { api } from '../lib/api';

interface AdminPortalProps {
  user?: User | null;
}

const GENRES = ['Sci-Fi', 'Cosmos', 'Fantasy', 'Mystery', 'Thriller', 'Business', 'Self-Help', 'Fiction', 'Non-Fiction', 'Classics'];

export const AdminPortal: React.FC<AdminPortalProps> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const preSelectedBookId = searchParams.get('bookId');

  // CRITICAL FIX: New Intuitive Workflow Views
  const [activeView, setActiveView] = useState<'catalog' | 'create_book' | 'manage_episodes'>('catalog');
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookEpisodes, setBookEpisodes] = useState<Episode[]>([]);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Book Form
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookNarrator, setBookNarrator] = useState('');
  const [bookGenre, setBookGenre] = useState('Sci-Fi');
  const [bookDescription, setBookDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrlInput, setCoverUrlInput] = useState('');

  // Episode Form
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [episodeTrackNumber, setEpisodeTrackNumber] = useState('');
  const [episodeDurationInput, setEpisodeDurationInput] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrlInput, setAudioUrlInput] = useState('');

  const fetchCatalog = async () => {
    try {
      const data = await api.getBooks();
      setBooks(data);
      if (preSelectedBookId) {
        const target = data.find(b => b.id === preSelectedBookId);
        if (target) {
          setSelectedBook(target);
          setActiveView('manage_episodes');
          fetchEpisodes(target.id);
        }
      }
    } catch {}
  };

  const fetchEpisodes = async (bookId: string) => {
    try {
      const bookData = await api.getBook(bookId);
      setBookEpisodes(bookData.episodes || []);
    } catch {}
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

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
      
      // Reset form and transition to episode manager for the new book
      setBookTitle(''); setBookAuthor(''); setBookNarrator(''); setBookDescription(''); setCoverFile(null); setCoverUrlInput('');
      fetchCatalog(); 
      setSelectedBook(created);
      setBookEpisodes([]);
      setActiveView('manage_episodes');
    } catch (err: any) { setStatusMessage({ type: 'error', msg: err.message || 'Failed to create book' }); } 
    finally { setLoading(false); }
  };

  const handleUploadEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    if (!audioFile && !audioUrlInput) return setStatusMessage({ type: 'error', msg: 'Audio required.' });
    try {
      setLoading(true); setStatusMessage(null);
      const formData = new FormData();
      if (episodeTitle) formData.append('title', episodeTitle);
      if (episodeTrackNumber) formData.append('trackNumber', episodeTrackNumber);
      if (episodeDurationInput) formData.append('durationSeconds', episodeDurationInput);
      if (audioFile) formData.append('audio', audioFile);
      else if (audioUrlInput) formData.append('audioUrl', audioUrlInput);

      await api.createEpisode(selectedBook.id, formData);
      setStatusMessage({ type: 'success', msg: 'Chapter uploaded!' });
      
      // Reset episode form and refresh list
      setEpisodeTitle(''); setEpisodeTrackNumber(''); setAudioFile(null); setAudioUrlInput(''); setEpisodeDurationInput('');
      fetchEpisodes(selectedBook.id);
      fetchCatalog();
    } catch (err: any) { setStatusMessage({ type: 'error', msg: err.message || 'Failed to upload episode' }); } 
    finally { setLoading(false); }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm('Delete this book and all its chapters forever?')) return;
    try {
      await api.deleteBook(bookId);
      setStatusMessage({ type: 'success', msg: 'Book deleted.' });
      fetchCatalog();
    } catch (err: any) { setStatusMessage({ type: 'error', msg: err.message || 'Failed to delete' }); }
  };

  const handleDeleteEpisode = async (epId: string) => {
    if (!window.confirm('Delete this chapter?')) return;
    try {
      await api.deleteEpisode(epId);
      if (selectedBook) fetchEpisodes(selectedBook.id);
    } catch (err: any) { setStatusMessage({ type: 'error', msg: 'Failed to delete chapter' }); }
  };

  const inputClass = "w-full px-4 py-2.5 bg-[#282828] border border-[#3e3e3e] rounded-md text-sm text-white focus:outline-none focus:border-white transition-colors placeholder-[#a7a7a7]";
  const labelClass = "block text-xs font-bold text-[#b3b3b3] mb-1.5 uppercase tracking-wide";

  return (
    <div className="space-y-8 pb-28 max-w-[1200px] mx-auto pt-4 px-4 md:px-8">
      
      {/* Dynamic Header Based on View */}
      <div className="flex items-center justify-between pb-6 border-b border-[#282828]">
        <div className="flex items-center gap-4">
          {activeView !== 'catalog' && (
            <button onClick={() => { setActiveView('catalog'); setSelectedBook(null); setStatusMessage(null); }} className="p-2 bg-[#282828] hover:bg-[#3e3e3e] rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {activeView === 'catalog' && 'Audiobook Catalog'}
              {activeView === 'create_book' && 'Create New Audiobook'}
              {activeView === 'manage_episodes' && `Manage Chapters: ${selectedBook?.title}`}
            </h1>
            <p className="text-sm text-[#b3b3b3]">
              {activeView === 'catalog' && 'Manage your entire library or add a new title.'}
              {activeView === 'create_book' && 'Add the foundational details for your new title.'}
              {activeView === 'manage_episodes' && 'Upload and arrange audio files for this book.'}
            </p>
          </div>
        </div>
        
        {activeView === 'catalog' && (
          <button onClick={() => { setActiveView('create_book'); setStatusMessage(null); }} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#facc15] hover:bg-[#eab308] text-black font-bold text-sm transition-transform active:scale-95 shadow-lg">
            <PlusCircle className="w-4 h-4" />
            <span>Create New Audiobook</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div className={`flex items-center gap-3 p-4 rounded-md text-sm font-bold ${statusMessage.type === 'success' ? 'bg-[#facc15]/10 text-[#facc15] border border-[#facc15]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{statusMessage.msg}</span>
        </div>
      )}

      {/* VIEW 1: CATALOG GRID */}
      {activeView === 'catalog' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {books.map(b => (
            <div key={b.id} className="group flex flex-col h-full bg-[#181818] rounded-xl p-4 transition-all duration-300 shadow-sm relative">
              <div 
                onClick={() => { setSelectedBook(b); setActiveView('manage_episodes'); fetchEpisodes(b.id); setStatusMessage(null); }}
                className="relative w-full aspect-square rounded-md overflow-hidden mb-4 bg-[#282828] cursor-pointer"
              >
                <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-4 py-2 bg-[#facc15] text-black font-bold text-xs rounded-full shadow-lg">Manage Chapters</span>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-[15px] font-bold text-white line-clamp-2">{b.title}</h3>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteBook(b.id); }} className="p-1.5 text-[#b3b3b3] hover:text-red-400 rounded transition-colors -mr-1.5"><Trash2 className="w-4 h-4" /></button>
                </div>
                <p className="text-[13px] text-[#b3b3b3] mb-3">{b.author}</p>
                
                <div className="mt-auto flex items-center justify-between text-[12px] text-[#b3b3b3] font-medium pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /><span>{b.episodesCount || 0} Ch.</span></div>
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /><span>{Math.floor((b.totalDurationSeconds || 0) / 60)}m</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: CREATE BOOK FORM */}
      {activeView === 'create_book' && (
        <form onSubmit={handleCreateBook} className="space-y-6 max-w-[800px]">
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
          
          <button type="submit" disabled={loading} className="px-8 py-3 rounded-full bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Audiobook'}
          </button>
        </form>
      )}

      {/* VIEW 3: MANAGE EPISODES */}
      {activeView === 'manage_episodes' && selectedBook && (
        <div className="space-y-10 max-w-[900px]">
          
          {/* Upload New Episode Section */}
          <div className="p-6 bg-[#181818] rounded-xl border border-[#282828]">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-[#facc15]" /> Upload New Chapter</h2>
            <form onSubmit={handleUploadEpisode} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label className={labelClass}>Chapter Title</label><input type="text" value={episodeTitle} onChange={e => setEpisodeTitle(e.target.value)} placeholder="e.g. Prologue" className={inputClass} /></div>
                <div><label className={labelClass}>Track Number</label><input type="number" value={episodeTrackNumber} onChange={e => setEpisodeTrackNumber(e.target.value)} placeholder="Auto if blank" className={inputClass} /></div>
                <div><label className={labelClass}>Duration (Secs)</label><input type="number" value={episodeDurationInput} onChange={e => setEpisodeDurationInput(e.target.value)} className={inputClass} /></div>
              </div>
              
              <div>
                <label className={labelClass}>Audio File *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative border-2 border-dashed border-[#facc15]/30 hover:border-[#facc15] rounded-md p-6 text-center cursor-pointer transition-colors bg-[#282828]">
                    <input type="file" accept="audio/*,video/mp4,.mp3,.mp4,.m4a,.aac" onChange={e => {
                      const file = e.target.files?.[0] || null; setAudioFile(file);
                      if (file) {
                        const objectUrl = URL.createObjectURL(file); 
                        const media = document.createElement('video');
                        media.src = objectUrl;
                        media.addEventListener('loadedmetadata', () => { 
                          if (media.duration && !isNaN(media.duration)) setEpisodeDurationInput(Math.round(media.duration).toString()); 
                          URL.revokeObjectURL(objectUrl); 
                        });
                      }
                    }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Music className="w-6 h-6 text-[#facc15] mx-auto mb-2" />
                    <span className="text-xs font-bold text-white">{audioFile ? audioFile.name : 'Upload MP3, MP4, AAC'}</span>
                  </div>
                  <input type="url" value={audioUrlInput} onChange={e => setAudioUrlInput(e.target.value)} placeholder="Or paste direct audio URL" className={inputClass} />
                </div>
              </div>
              
              <button type="submit" disabled={loading} className="px-8 py-3 rounded-full bg-[#facc15] text-black font-bold text-sm hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                {loading ? 'Uploading...' : 'Upload Chapter'}
              </button>
            </form>
          </div>

          {/* List Existing Episodes */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Existing Chapters ({bookEpisodes.length})</h3>
            <div className="space-y-2">
              {bookEpisodes.map(ep => (
                <div key={ep.id} className="flex items-center justify-between p-4 bg-[#181818] rounded-lg border border-[#282828]">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-[#282828] flex items-center justify-center text-xs font-bold text-[#b3b3b3]">{ep.trackNumber}</div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{ep.title}</h4>
                      <p className="text-xs text-[#b3b3b3] font-mono">{Math.floor(ep.durationSeconds / 60)}:{Math.floor(ep.durationSeconds % 60).toString().padStart(2, '0')}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteEpisode(ep.id)} className="p-2 text-[#b3b3b3] hover:text-red-400 hover:bg-[#282828] rounded-full transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {bookEpisodes.length === 0 && (
                <p className="text-sm text-[#b3b3b3] text-center py-8">No chapters uploaded yet.</p>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
