'use client';

import { useState } from 'react';

interface Props {
  urls: string[];
}

export function PhotoGallery({ urls }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (urls.length === 0) {
    return <p className="text-sm text-gray-400 italic">No photos attached</p>;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className="relative h-20 w-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:scale-105 transition-all"
          >
            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
              <svg className="h-5 w-5 text-white opacity-0 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {activeIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setActiveIdx(null)}
        >
          <div
            className="relative w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <img
              src={urls[activeIdx]}
              alt={`Photo ${activeIdx + 1}`}
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />

            {/* Counter */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
              {activeIdx + 1} / {urls.length}
            </div>

            {/* Close */}
            <button
              onClick={() => setActiveIdx(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg text-gray-700 hover:bg-gray-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Prev */}
            {activeIdx > 0 && (
              <button
                onClick={() => setActiveIdx(activeIdx - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next */}
            {activeIdx < urls.length - 1 && (
              <button
                onClick={() => setActiveIdx(activeIdx + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
