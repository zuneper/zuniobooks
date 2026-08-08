import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { AudioProvider } from './context/AudioContext';
import { AudioPlayer } from './components/AudioPlayer';
import { api } from './lib/api';
import { User } from './types';

// Page Views
import { ExploreView } from './components/ExploreView';
import { BookDetailView } from './components/BookDetailView';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';

// We put the layout inside a child component so we can use the 'useNavigate' hook
const AppContent = ({ user, handleLogout, searchQuery, setSearchQuery }: any) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans">
      <Header 
        user={user} 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLogout={handleLogout}
        // Push real URLs instead of changing state
        onNavigateHome={() => navigate('/home')}
        onNavigateAdmin={() => navigate('/admin')}
        onLoginClick={() => navigate('/login')}
        onSignupClick={() => navigate('/signup')}
        onToggleMobileMenu={() => {}}
      />

      {/* The main scrollable area where the pages change */}
      <main className="flex-1 overflow-y-auto pb-24" id="main-scroll-container">
        <Routes>
          {/* Default redirect to home */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          
          <Route path="/home" element={
            <ExploreView 
              searchQuery={searchQuery} 
              onClearSearch={() => setSearchQuery('')}
              user={user}
              onNavigateAdmin={() => navigate('/admin')}
            />
          } />
          
          <Route path="/library" element={
            <ExploreView 
              searchQuery={searchQuery} 
              filter="library"
              onClearSearch={() => setSearchQuery('')}
              user={user}
              onNavigateAdmin={() => navigate('/admin')}
            />
          } />
          
          {/* Beautiful Book and Episode URLs */}
          <Route path="/book/:bookId" element={
            <BookDetailView 
              user={user} 
              onOpenAuth={() => navigate('/login')} 
            />
          } />
          
          <Route path="/book/:bookId/episode/:episodeId" element={
            <BookDetailView 
              user={user} 
              onOpenAuth={() => navigate('/login')} 
            />
          } />
          
          {/* Protected Admin Portal */}
          <Route path="/admin" element={user?.role === 'admin' ? <AdminPortal /> : <Navigate to="/home" />} />
        </Routes>
      </main>

      {/* Auth Modals triggered directly by the URL (e.g., moonzune.com/login) */}
      {(location.pathname === '/login' || location.pathname === '/signup') && (
        <AuthModal 
          mode={location.pathname.replace('/', '') as 'login' | 'signup'}
          onClose={() => navigate(-1)} 
          onSuccess={() => navigate('/home')} 
        />
      )}

      {/* The Spotify Secret: The AudioPlayer sits outside the Routes so it never stops playing! */}
      <AudioPlayer />
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-login check on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getCurrentUser().then(setUser).catch(() => localStorage.removeItem('token'));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AudioProvider>
      <Router>
        <AppContent 
          user={user} 
          handleLogout={handleLogout}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Router>
    </AudioProvider>
  );
}
