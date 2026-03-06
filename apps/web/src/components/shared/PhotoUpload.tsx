'use client';

import { useState, useRef } from 'react';
import { getClientStorage } from '@/lib/firebase-client';
import { ref, uploadBytesResumable } from 'firebase/storage';

interface Props {
  agentId: string;
  leadDraftId: string;
  onUpload: (paths: string[]) => void;
  value: string[];
  error?: string;
}

const MAX_PHOTOS = 3;
const MAX_SIZE_MB = 5;

async function resizeImage(file: File, maxWidth = 1280): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => { URL.revokeObjectURL(url); blob ? resolve(blob) : reject(new Error('Resize failed')); },
        'image/jpeg',
        0.82
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}

interface UploadItem {
  name: string;
  progress: number;
  done: boolean;
  error: boolean;
}

export function PhotoUpload({ agentId, leadDraftId, onUpload, value, error }: Props) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uploading = uploads.some((u) => !u.done && !u.error);

  const updateItem = (index: number, patch: Partial<UploadItem>) =>
    setUploads((prev) => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)));

  const handleFiles = async (files: FileList) => {
    const remaining = MAX_PHOTOS - value.length;
    if (remaining <= 0) { setUploadError(`Maximum ${MAX_PHOTOS} photos allowed`); return; }
    setUploadError('');

    const toUpload = Array.from(files).slice(0, remaining);
    setUploads(toUpload.map((f) => ({ name: f.name, progress: 0, done: false, error: false })));

    const paths: string[] = [];
    const storage = getClientStorage();

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i]!;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`Each photo must be under ${MAX_SIZE_MB}MB`);
        updateItem(i, { error: true, done: true });
        continue;
      }
      try {
        const resized = await resizeImage(file);
        const storagePath = `leads/${leadDraftId}/photos/${Date.now()}_${file.name}`;
        const task = uploadBytesResumable(ref(storage, storagePath), resized, { contentType: 'image/jpeg' });

        await new Promise<void>((resolve, reject) => {
          task.on(
            'state_changed',
            (snap) => updateItem(i, { progress: Math.round((snap.bytesTransferred / snap.totalBytes) * 100) }),
            (err) => { updateItem(i, { error: true, done: true }); reject(err); },
            () => { updateItem(i, { progress: 100, done: true }); paths.push(storagePath); resolve(); }
          );
        });
      } catch {
        updateItem(i, { error: true, done: true });
        setUploadError('Upload failed. Please try again.');
      }
    }

    if (paths.length > 0) onUpload([...value, ...paths]);
    setTimeout(() => setUploads([]), 1200);
  };

  const displayError = error ?? uploadError;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Photos <span className="text-red-500">*</span>
        <span className="ml-1 text-xs text-gray-400">(1-3 photos)</span>
      </label>

      {value.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {value.map((path, i) => (
            <div key={i} className="relative h-16 w-16 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
              <div className="flex h-full items-center justify-center">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <button
                onClick={() => onUpload(value.filter((_, idx) => idx !== i))}
                className="absolute right-0.5 top-0.5 rounded-full bg-red-500 p-0.5 text-white"
                type="button"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Per-image progress bars */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white/70 px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 truncate max-w-[70%]">{u.name}</span>
                <span className={`text-xs font-semibold ${u.error ? 'text-red-500' : u.done ? 'text-green-600' : 'text-gray-500'}`}>
                  {u.error ? 'Failed' : u.done ? 'Done ✓' : `${u.progress}%`}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    u.error ? 'bg-red-400' : u.done ? 'bg-green-500' : 'brand-gradient'
                  }`}
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length < MAX_PHOTOS && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm text-gray-500 hover:border-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </span>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Take / Upload Photo
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </>
      )}

      {displayError && <p className="text-xs text-red-600">{displayError}</p>}
    </div>
  );
}
