'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

interface SearchResult {
  type: string;
  icon: string;
  title: string;
  excerpt: string;
  url: string;
  chapterNumber?: number;
}

export function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const performSearch = async () => {
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
    };

    performSearch();
  }, [query]);

  if (!query || query.length < 2) {
    return (
      <div className="text-center py-12">
        <Search className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
        <p className="text-zinc-400">Enter a search query to find chapters and blog posts</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
        <p className="text-zinc-400 mb-2">No results found for "{query}"</p>
        <p className="text-sm text-zinc-500">Try different keywords or check your spelling</p>
      </div>
    );
  }

  // Group results by type
  const chapters = results.filter(r => r.type === 'Chapter');
  const pages = results.filter(r => r.type === 'Page');
  const blogPosts = results.filter(r => r.type === 'Blog');

  return (
    <div className="space-y-8">
      {/* Chapters */}
      {chapters.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">
            Chapters ({chapters.length})
          </h2>
          <div className="space-y-3">
            {chapters.map((result, index) => (
              <Link
                key={index}
                href={result.url}
                className="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-cyan-400/30 hover:bg-zinc-900"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{result.icon}</span>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-medium text-cyan-400 uppercase">
                        {result.type}
                      </span>
                      {result.chapterNumber && (
                        <span className="text-xs text-zinc-500">
                          Chapter {result.chapterNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-zinc-100">
                      {result.title}
                    </h3>
                    {result.excerpt && (
                      <p className="text-sm text-zinc-400 line-clamp-2">
                        {result.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pages */}
      {pages.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">
            Pages ({pages.length})
          </h2>
          <div className="space-y-3">
            {pages.map((result, index) => (
              <Link
                key={index}
                href={result.url}
                className="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-cyan-400/30 hover:bg-zinc-900"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{result.icon}</span>
                  <div className="flex-1">
                    <div className="mb-2">
                      <span className="text-xs font-medium text-green-400 uppercase">
                        {result.type}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-zinc-100">
                      {result.title}
                    </h3>
                    {result.excerpt && (
                      <p className="text-sm text-zinc-400 line-clamp-2">
                        {result.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Blog Posts */}
      {blogPosts.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">
            Blog Posts ({blogPosts.length})
          </h2>
          <div className="space-y-3">
            {blogPosts.map((result, index) => (
              <Link
                key={index}
                href={result.url}
                className="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-cyan-400/30 hover:bg-zinc-900"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{result.icon}</span>
                  <div className="flex-1">
                    <div className="mb-2">
                      <span className="text-xs font-medium text-purple-400 uppercase">
                        {result.type}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-zinc-100">
                      {result.title}
                    </h3>
                    {result.excerpt && (
                      <p className="text-sm text-zinc-400 line-clamp-2">
                        {result.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
