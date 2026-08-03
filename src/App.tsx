import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Book } from './types';
import { api } from './lib/api';
import { AudioProvider } from './context/AudioContext';
import { GalaxyBackground } from './components/GalaxyBackground';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { ExploreView } from './components/ExploreView';
import { BookDetailView } from './components/BookDetailView';
import { LibraryView } from './components/LibraryView';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { GuestAuthView } from './components/GuestAuthView';

// Smooth, premium easing curve for page transitions
const pageVariants = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -15, scale: 0.98 },
};
const pageTransition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

export function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<string>('explore');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [preSelectedAdminBookId, setPreSelectedAdminBookId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    api
      .getMe()
      .then((u) => setUser(u))
      .catch(() => {
        api.logout();
      });
  }, []);

  const refreshBooks = async () => {
    try {
      setLoadingBooks(true);
      const data = await api.getBooks(searchQuery);
      setBooks(data);
    } catch (err) {
      console.error('Failed to load books:', err);
    } finally {
      setLoadingBooks(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshBooks();
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && activeView !== 'explore') {
      setActiveView('explore');
    }
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBookId(book.id);
    setActiveView('detail');
  };

  const handleNavigateAdminUploadEpisode = (bookId: string) => {
    setPreSelectedAdminBookId(bookId);
    setActiveView('admin');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    if (activeView === 'admin') setActiveView('explore');
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans selection:bg-[#1ed760] selection:text-black overflow-x-hidden bg-[#121212]">
      <GalaxyBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          user={user}
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onNavigateAdmin={() => setActiveView('admin')}
          onNavigateHome={() => {
            setActiveView('explore');
            setSelectedBookId(null);
            setSearchQuery('');
          }}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {!user ? (
          <GuestAuthView
            onSuccess={(loggedUser) => {
              setUser(loggedUser);
              refreshBooks();
            }}
          />
        ) : (
          <div className="flex-1 flex max-w-[1600px] w-full mx-auto relative">
            <Sidebar
              activeView={activeView}
              setActiveView={(view) => {
                setActiveView(view);
                if (view !== 'detail') setSelectedBookId(null);
              }}
              user={user}
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
            />

            {/* The main-scroll-container ID is required here for the sticky header transition */}
            <main id="main-scroll-container" className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto overflow-x-hidden">
              <AnimatePresence mode="wait">
                {activeView === 'explore' && (
                  <motion.div
                    key="explore"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="min-h-full"
                  >
                    <ExploreView
                      books={books}
                      searchQuery={searchQuery}
                      onClearSearch={() => setSearchQuery('')}
                      onSelectBook={handleSelectBook}
                      user={user}
                      onOpenAuth={() => setIsAuthModalOpen(true)}
                      onNavigateAdmin={() => setActiveView('admin')}
                      refreshBooks={refreshBooks}
                    />
                  </motion.div>
                )}

                {activeView === 'detail' && selectedBookId && (
                  <motion.div
                    key="detail"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="min-h-full"
                  >
                    <BookDetailView
                      bookId={selectedBookId}
                      onBack={() => setActiveView('explore')}
                      user={user}
                      onOpenAuth={() => setIsAuthModalOpen(true)}
                      onNavigateAdminUploadEpisode={handleNavigateAdminUploadEpisode}
                      refreshBooks={refreshBooks}
                    />
                  </motion.div>
                )}

                {activeView === 'library' && (
                  <motion.div
                    key="library"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="min-h-full"
                  >
                    <LibraryView
                      onSelectBook={handleSelectBook}
                      user={user}
                      onOpenAuth={() => setIsAuthModalOpen(true)}
                    />
                  </motion.div>
                )}

                {activeView === 'favorites' && (
                  <motion.div
                    key="favorites"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="min-h-full"
                  >
                    <LibraryView
                      onSelectBook={handleSelectBook}
                      user={user}
                      onOpenAuth={() => setIsAuthModalOpen(true)}
                    />
                  </motion.div>
                )}

                {activeView === 'admin' && (
                  <motion.div
                    key="admin"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="min-h-full"
                  >
                    <AdminPortal
                      user={user}
                      refreshBooks={refreshBooks}
                      preSelectedBookId={preSelectedAdminBookId}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>
        )}

        {user && <AudioPlayerBar />}

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={(loggedUser) => {
            setUser(loggedUser);
            refreshBooks();
          }}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  );
}
