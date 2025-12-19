'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Search as user types
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery('');
      setResults([]);
    }
  };

  const handleResultClick = (url: string) => {
    router.push(url);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Search Button/Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search chapters, blog posts..."
            className="w-64 rounded-full border border-zinc-700 bg-zinc-900/50 py-2 pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="absolute right-3 text-zinc-400 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {isExpanded && isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full right-0 z-50 mt-2 w-96 max-h-96 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
          {loading ? (
            <div className="p-4 text-center text-sm text-zinc-400">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleResultClick(result.url)}
                  className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{result.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-cyan-400 uppercase">
                          {result.type}
                        </span>
                        {result.chapterNumber && (
                          <span className="text-xs text-zinc-500">
                            Chapter {result.chapterNumber}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-100 mb-1 truncate">
                        {result.title}
                      </h4>
                      {result.excerpt && (
                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {result.excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              <div className="border-t border-zinc-700 px-4 py-2">
                <button
                  onClick={handleSubmit}
                  className="w-full text-sm text-cyan-400 hover:text-cyan-300 text-center"
                >
                  View all results →
                </button>
              </div>
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center text-sm text-zinc-400">
              No results found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
