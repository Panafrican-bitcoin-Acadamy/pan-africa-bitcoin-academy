'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ZoomableImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  /** Optional: override thumbnail max height e.g. "max-h-96" for larger chapter images */
  thumbnailClassName?: string;
}

export function ZoomableImage({ src, alt, caption, className = '', thumbnailClassName }: ZoomableImageProps) {
  const thumbClass = thumbnailClassName ?? 'max-h-64';
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    pointerId: number | null;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0, pointerId: null });

  const openModal = useCallback(() => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setZoom(100);
    setPan({ x: 0, y: 0 });
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
  const resetZoom = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  // If user zooms out to (or below) 100%, reset panning
  useEffect(() => {
    if (zoom <= 100) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  const canPan = open && zoom > 100;

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
        className="flex-1 flex items-center justify-center overflow-hidden p-4"
        onClick={() => {
          if (isPanning) return;
          closeModal();
        }}
      >
        <div
          className="relative max-w-full max-h-full"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => {
            if (!canPan) return;
            // Only left click / primary touch
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            setIsPanning(true);
            panStateRef.current.active = true;
            panStateRef.current.startX = e.clientX;
            panStateRef.current.startY = e.clientY;
            panStateRef.current.originX = pan.x;
            panStateRef.current.originY = pan.y;
            panStateRef.current.pointerId = e.pointerId;
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!panStateRef.current.active) return;
            const dx = e.clientX - panStateRef.current.startX;
            const dy = e.clientY - panStateRef.current.startY;
            setPan({
              x: panStateRef.current.originX + dx,
              y: panStateRef.current.originY + dy,
            });
          }}
          onPointerUp={(e) => {
            if (!panStateRef.current.active) return;
            panStateRef.current.active = false;
            panStateRef.current.pointerId = null;
            setIsPanning(false);
            try {
              (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
            } catch {
              // ignore
            }
          }}
          onPointerCancel={(e) => {
            if (!panStateRef.current.active) return;
            panStateRef.current.active = false;
            panStateRef.current.pointerId = null;
            setIsPanning(false);
            try {
              (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
            } catch {
              // ignore
            }
          }}
          style={{
            cursor: canPan ? (isPanning ? 'grabbing' : 'grab') : 'zoom-out',
            touchAction: canPan ? 'none' : 'auto',
          }}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl transition-transform select-none"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})` }}
            draggable={false}
          />
        </div>
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
        className={`block w-full rounded-lg border border-cyan-400/20 shadow-lg object-contain overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950 transition hover:border-cyan-400/40 ${thumbClass}`}
        aria-label={`View full size: ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-contain cursor-zoom-in ${thumbClass} ${className}`}
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
