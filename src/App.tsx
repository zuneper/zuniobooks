import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AudioProvider } from './context/AudioContext';
import { AudioPlayerBar } from './components/AudioPlayerBar'; 

import { api } from './lib/api';
import { User } from './types';

// Page Views
import { ExploreView } from './components/ExploreView';
import { LibraryView } from './components/LibraryView';
import { BookDetailView } from './components/BookDetailView';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { WelcomeView } from './components/WelcomeView';

const AppContent = ({ user, setUser, handleLogout, searchQuery, setSearchQuery }: any) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans">
      <Header 
        user={user} 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLogout={handleLogout}
        onNavigateHome={() => navigate('/home')}
        onNavigateAdmin={() => navigate('/admin')}
        onLoginClick={() => navigate('/login')}
        onSignupClick={() => navigate('/signup')}
        onToggleMobileMenu={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {user && (
          <Sidebar 
            user={user} 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        )}

        <main className="flex-1 overflow-y-auto pb-24" id="main-scroll-container">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            <Route path="/home" element={
              user ? (
                <ExploreView 
                  searchQuery={searchQuery} 
                  onClearSearch={() => setSearchQuery('')}
                  user={user}
                  onNavigateAdmin={() => navigate('/admin')}
                />
              ) : (
                <WelcomeView onOpenAuth={() => navigate('/login')} />
              )
            } />
            
            <Route path="/library" element={
              <LibraryView 
                user={user}
                onOpenAuth={() => navigate('/login')}
                onSelectBook={(book) => navigate(`/book/${book.id}`)}
              />
            } />

            <Route path="/favorites" element={
              <LibraryView 
                user={user}
                onOpenAuth={() => navigate('/login')}
                onSelectBook={(book) => navigate(`/book/${book.id}`)}
              />
            } />
            
            <Route path="/book/:bookId" element={
              <BookDetailView user={user} onOpenAuth={() => navigate('/login')} />
            } />
            
            <Route path="/book/:bookId/episode/:episodeId" element={
              <BookDetailView user={user} onOpenAuth={() => navigate('/login')} />
            } />
            
            {/* CRITICAL SECURITY LOCK: Prevents URL hijacking by standard users */}
            <Route path="/admin" element={user?.role === 'admin' ? <AdminPortal user={user} /> : <Navigate to="/home" />} />
          </Routes>
        </main>
      </div>

      {(location.pathname === '/login' || location.pathname === '/signup') && (
        <AuthModal 
          isOpen={true}
          mode={location.pathname.replace('/', '') as 'login' | 'signup'}
          onClose={() => navigate(-1)} 
          onSuccess={(loggedInUser) => {
            setUser(loggedInUser); 
            navigate('/home');
          }} 
        />
      )}

      <AudioPlayerBar />
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('zuniobooks_token');
    if (token) {
      api.getMe().then(setUser).catch(() => localStorage.removeItem('zuniobooks_token'));
    }
  }, []);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    window.location.href = "/home"; // Force refresh to home on logout
  };

  return (
    <AudioProvider>
      <Router>
        <AppContent 
          user={user} 
          setUser={setUser} 
          handleLogout={handleLogout}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Router>
    </AudioProvider>
  );
}
