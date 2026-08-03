import React from 'react';
import { Home, Bookmark, Heart, Shield, X } from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  user,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 w-[240px] flex-shrink-0 flex flex-col bg-black p-6 space-y-6 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between md:hidden pb-4 border-b border-[#282828]">
          <span className="text-white font-bold tracking-widest uppercase text-xs">Menu</span>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => { setActiveView('explore'); onClose(); }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-md text-sm font-bold transition-colors ${
              activeView === 'explore' ? 'bg-[#282828] text-white' : 'text-[#b3b3b3] hover:text-white hover:bg-[#181818]'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => { setActiveView('library'); onClose(); }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-md text-sm font-bold transition-colors ${
              activeView === 'library' ? 'bg-[#282828] text-white' : 'text-[#b3b3b3] hover:text-white hover:bg-[#181818]'
            }`}
          >
            <Bookmark className="w-5 h-5" />
            <span>Library</span>
          </button>

          <button
            onClick={() => { setActiveView('favorites'); onClose(); }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-md text-sm font-bold transition-colors ${
              activeView === 'favorites' ? 'bg-[#282828] text-white' : 'text-[#b3b3b3] hover:text-white hover:bg-[#181818]'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span>Favorites</span>
          </button>

          {user?.role === 'admin' && (
            <div className="pt-6 mt-6 border-t border-[#282828]">
              <button
                onClick={() => { setActiveView('admin'); onClose(); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-md text-sm font-bold transition-colors ${
                  activeView === 'admin' ? 'bg-[#282828] text-white' : 'text-[#b3b3b3] hover:text-white hover:bg-[#181818]'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Admin Portal</span>
              </button>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};
