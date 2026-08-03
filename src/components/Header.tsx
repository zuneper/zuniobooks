import React, { useState } from 'react';
import { Search, User as UserIcon, LogOut, Menu, X, Library } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNavigateHome: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  searchQuery,
  setSearchQuery,
  onOpenAuth,
  onLogout,
  onNavigateHome,
  onToggleMobileMenu,
}) => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex flex-col px-4 sm:px-6 py-3 bg-black/90 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 max-w-[1600px] w-full mx-auto">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          {user && (
            <button onClick={onToggleMobileMenu} className="md:hidden text-[#b3b3b3] hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
          )}
          <div onClick={onNavigateHome} className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <Library className="w-4 h-4 text-black" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">Zuniobooks</span>
          </div>
        </div>

        {/* Search */}
        <div className="hidden sm:flex relative flex-1 max-w-sm mx-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b3b3b3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            className="w-full pl-10 pr-10 py-2.5 text-sm text-white bg-[#282828] hover:bg-[#3e3e3e] focus:bg-[#3e3e3e] border-none rounded-full focus:outline-none focus:ring-2 focus:ring-white transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="sm:hidden text-[#b3b3b3] hover:text-white">
            {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#282828]">
                <UserIcon className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">{user.username}</span>
              </div>
              <button onClick={onLogout} title="Log out" className="p-2 text-[#b3b3b3] hover:text-white hover:bg-[#282828] rounded-full transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="px-6 py-2 rounded-full text-sm font-bold text-black bg-white hover:scale-105 transition-transform active:scale-95">
              Log In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Dropdown */}
      {showMobileSearch && (
        <div className="sm:hidden mt-3 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b3b3b3]" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audiobooks..."
            className="w-full pl-10 pr-4 py-2.5 text-sm text-white bg-[#282828] rounded-md focus:outline-none"
          />
        </div>
      )}
    </header>
  );
};
