import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Book } from '../types';
import { Play } from 'lucide-react';

export const ExploreView: React.FC<{ searchQuery?: string, filter?: string }> = ({ searchQuery = '', filter = '' }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    api.getBooks().then((allBooks) => {
      let filtered = allBooks;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
      }
      if (filter === 'library') {
        filtered = filtered.filter((b: any) => b.isFavorite); 
      }
      setBooks(filtered);
      setIsLoading(false);
    });
  }, [searchQuery, filter]);

  if (isLoading) {
    return <div className="text-[#FFD700] text-center mt-20 text-xl animate-pulse">Loading Universe...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
        {filter === 'library' ? 'Your Library' : 'Explore'}
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {books.map((book) => (
          <div 
            key={book.id}
            onClick={() => navigate(`/book/${book.id}`)}
            className="group relative bg-[#1A1A1A] rounded-xl overflow-hidden cursor-pointer border border-transparent hover:border-[#FFD700] transition-all duration-300 shadow-lg hover:shadow-[#FFD700]/20"
          >
            <div className="aspect-square overflow-hidden relative">
              <img 
                src={book.coverUrl} 
                alt={book.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-[#FFD700] p-3 rounded-full text-black transform scale-0 group-hover:scale-100 transition-transform duration-300">
                  <Play fill="currentColor" />
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-white font-semibold truncate text-sm md:text-base">{book.title}</h3>
              <p className="text-gray-400 text-xs md:text-sm truncate mt-1">{book.author}</p>
            </div>
          </div>
        ))}
      </div>
      
      {books.length === 0 && (
        <div className="text-gray-500 text-center mt-20">
          No audiobooks found matching your criteria.
        </div>
      )}
    </div>
  );
};
