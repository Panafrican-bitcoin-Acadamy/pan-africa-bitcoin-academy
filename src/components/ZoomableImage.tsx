'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ZoomableImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

export function ZoomableImage({ src, alt, caption, className = '' }: ZoomableImageProps) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(100);

  const openModal = useCallback(() => {
    setZoom(100);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setZoom(100);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, closeModal]);

  const zoomIn = () => setZoom((z) => Math.min(z + 25, 300));
  const zoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const resetZoom = () => setZoom(100);

  const modal = open && typeof document !== 'undefined' && createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Zoomable image view"
    >
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <p className="text-sm text-zinc-400 truncate max-w-[50%]" title={alt}>
          {alt}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 50}
            className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white min-w-[3rem] transition"
            title="Reset zoom"
          >
            {zoom}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= 300}
            className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition ml-2"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div
        className="flex-1 flex items-center justify-center overflow-auto p-4"
        onClick={closeModal}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl transition-transform select-none"
          style={{ transform: `scale(${zoom / 100})` }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </div>
      {caption && (
        <p className="p-3 text-center text-sm text-zinc-400 border-t border-zinc-800">
          {caption}
        </p>
      )}
    </div>,
    document.body
  );

  return (
    <div className="flex flex-col items-center space-y-3">
      <button
        type="button"
        onClick={openModal}
        className="block w-full rounded-lg border border-cyan-400/20 shadow-lg object-contain max-h-64 overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950 transition hover:border-cyan-400/40"
        aria-label={`View full size: ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-contain max-h-64 cursor-zoom-in ${className}`}
          draggable={false}
        />
      </button>
      {caption && (
        <p className="text-center text-sm text-zinc-300 leading-relaxed px-2">
          {caption}
        </p>
      )}
      {modal}
    </div>
  );
}
