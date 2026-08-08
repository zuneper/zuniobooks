import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, User as UserIcon, LogOut, Menu, X, Library, Shield } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onLogout: () => void;
  onNavigateHome: () => void;
  onToggleMobileMenu: () => void;
  onNavigateAdmin: () => void;
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  searchQuery,
  setSearchQuery,
  onLogout,
  onNavigateHome,
  onToggleMobileMenu,
  onNavigateAdmin,
  onLoginClick,
}) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [headerOpacity, setHeaderOpacity] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollY = scrollContainer.scrollTop;
      const newOpacity = Math.min(scrollY / 150, 1);
      setHeaderOpacity(newOpacity);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // UX FIX: If they search from a book page or admin portal, snap them to the home page!
    if (e.target.value && location.pathname !== '/home') {
      navigate('/home');
    }
  };

  return (
    <header 
      className="sticky top-0 z-30 flex flex-col px-4 sm:px-6 py-3 transition-colors duration-200"
      style={{ 
        backgroundColor: `rgba(18, 18, 18, ${headerOpacity})`,
        backdropFilter: headerOpacity > 0 ? `blur(${headerOpacity * 12}px)` : 'none'
      }}
    >
      <div className="flex items-center justify-between gap-4 max-w-[1600px] w-full mx-auto">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          {user && (
            <button onClick={onToggleMobileMenu} className="md:hidden text-[#b3b3b3] hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          )}
          <div onClick={onNavigateHome} className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#facc15] flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_15px_rgba(250,204,21,0.3)]">
              <Library className="w-4 h-4 text-black" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block tracking-tight hover:text-white transition-colors">
              Zuniobooks
            </span>
          </div>
        </div>

        {/* Desktop Search */}
        {user && (
          <div className="hidden sm:flex relative flex-1 max-w-sm mx-4 group">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchQuery ? 'text-white' : 'text-[#b3b3b3] group-hover:text-white'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="What do you want to listen to?"
              className="w-full pl-10 pr-10 py-2.5 text-sm text-white bg-[#282828] hover:bg-[#3e3e3e] focus:bg-[#3e3e3e] border border-transparent focus:border-white rounded-full focus:outline-none transition-all placeholder-[#a7a7a7]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="sm:hidden text-[#b3b3b3] hover:text-white transition-colors">
              {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              
              {/* ADMIN SHIELD BUTTON */}
              {user.role === 'admin' && (
                <button 
                  onClick={onNavigateAdmin} 
                  title="Admin Portal" 
                  className="p-2 text-[#facc15] hover:text-white hover:bg-[#282828] rounded-full transition-colors mr-1"
                >
                  <Shield className="w-5 h-5" />
                </button>
              )}

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 hover:bg-[#282828] cursor-pointer transition-colors border border-transparent hover:border-[#3e3e3e]">
                <div className="w-6 h-6 rounded-full bg-[#3e3e3e] flex items-center justify-center overflow-hidden">
                  <UserIcon className="w-3.5 h-3.5 text-[#b3b3b3]" />
                </div>
                <span className="text-sm font-bold text-white pr-1">{user.username}</span>
              </div>
              <button onClick={onLogout} title="Log out" className="p-2 text-[#b3b3b3] hover:text-white hover:bg-[#282828] rounded-full transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onLoginClick} 
              className="px-6 py-2.5 rounded-full text-sm font-bold text-black bg-[#facc15] hover:scale-105 active:scale-95 transition-transform shadow-[0_4px_14px_rgba(250,204,21,0.25)]"
            >
              Signup/Login
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Dropdown */}
      {showMobileSearch && user && (
        <div className="sm:hidden mt-3 relative w-full pb-2">
          <Search className="absolute left-3 top-[38%] -translate-y-1/2 w-4 h-4 text-[#b3b3b3]" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search audiobooks..."
            className="w-full pl-10 pr-4 py-3 text-sm text-white bg-[#282828] rounded-md focus:outline-none focus:bg-[#3e3e3e] transition-colors"
          />
        </div>
      )}
    </header>
  );
};
