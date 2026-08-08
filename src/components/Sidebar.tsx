import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Bookmark, Shield, X, Heart } from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = location.pathname;

  const navItemClass = (path: string) => `w-full flex items-center gap-4 px-4 py-3 rounded-md text-sm font-bold transition-colors ${
    activeView.startsWith(path) ? 'bg-[#282828] text-white' : 'text-[#b3b3b3] hover:text-white hover:bg-[#181818]'
  }`;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 w-[240px] flex-shrink-0 flex flex-col bg-black p-6 space-y-6 transition-transform duration-300 ease-in-out border-r border-[#282828]`}
      >
        <div className="flex items-center justify-between md:hidden pb-4 border-b border-[#282828]">
          <span className="text-white font-bold tracking-widest uppercase text-xs">Menu</span>
          <button onClick={onClose} className="text-[#b3b3b3] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-2">
          <button onClick={() => { navigate('/home'); onClose(); }} className={navItemClass('/home')}>
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          <button onClick={() => { navigate('/library'); onClose(); }} className={navItemClass('/library')}>
            <Bookmark className="w-5 h-5" />
            <span>Library</span>
          </button>

          <button onClick={() => { navigate('/favorites'); onClose(); }} className={navItemClass('/favorites')}>
            <Heart className="w-5 h-5" />
            <span>Favorites</span>
          </button>

          {/* CRITICAL SECURITY LOCK: Hides Admin button from standard users */}
          {user?.role === 'admin' && (
            <div className="pt-6 mt-6 border-t border-[#282828]">
              <button onClick={() => { navigate('/admin'); onClose(); }} className={navItemClass('/admin')}>
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
