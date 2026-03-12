'use client';

import { useState, useRef } from 'react';
import { uploadLeadPhoto } from '@/app/(agent)/agent/leads/new/upload-action';

interface Props {
  agentId: string;
  leadDraftId: string;
  onUpload: (paths: string[]) => void;
  value: string[];
  error?: string;
}

const MAX_PHOTOS = 3;
const MAX_SIZE_MB = 5;

async function compressImage(file: File, maxWidth = 1280): Promise<{ blob: Blob; base64: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) { reject(new Error('Compress failed')); return; }
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            // Strip data URL prefix: "data:image/jpeg;base64,"
            const base64 = dataUrl.split(',')[1]!;
            resolve({ blob, base64 });
          };
          reader.onerror = () => reject(new Error('Read failed'));
          reader.readAsDataURL(blob);
        },
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
  progress: number; // 0-100; -1 = indeterminate
  done: boolean;
  error: boolean;
}

export function PhotoUpload({ agentId, leadDraftId, onUpload, value, error }: Props) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uploading = uploads.some((u) => !u.done && !u.error);

  const patch = (i: number, p: Partial<UploadItem>) =>
    setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, ...p } : u)));

  const handleFiles = async (files: FileList) => {
    const remaining = MAX_PHOTOS - value.length;
    if (remaining <= 0) { setUploadError(`Maximum ${MAX_PHOTOS} photos allowed`); return; }
    setUploadError('');

    const toUpload = Array.from(files).slice(0, remaining);
    setUploads(toUpload.map((f) => ({ name: f.name, progress: 0, done: false, error: false })));

    const newPaths: string[] = [];

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i]!;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`Each photo must be under ${MAX_SIZE_MB}MB`);
        patch(i, { error: true, done: true, progress: 0 });
        continue;
      }

      try {
        // Step 1: compress (0 → 35%)
        patch(i, { progress: 5 });
        const { base64 } = await compressImage(file);
        patch(i, { progress: 35 });

        // Step 2: upload via server action (-1 = indeterminate shimmer)
        patch(i, { progress: -1 });
        const result = await uploadLeadPhoto(base64, file.name, leadDraftId);

        if ('error' in result) {
          patch(i, { error: true, done: true, progress: 0 });
          setUploadError(result.error);
        } else {
          patch(i, { progress: 100, done: true });
          newPaths.push(result.path);
        }
      } catch {
        patch(i, { error: true, done: true, progress: 0 });
        setUploadError('Upload failed. Please try again.');
      }
    }

    if (newPaths.length > 0) onUpload([...value, ...newPaths]);
    setTimeout(() => setUploads([]), 1500);
  };

  const displayError = error ?? uploadError;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Photos <span className="text-red-500">*</span>
        <span className="ml-1 text-xs text-gray-400">(1–3 required)</span>
      </label>

      {/* Uploaded thumbnails */}
      {value.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {value.map((_, i) => (
            <div key={i} className="relative h-16 w-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <button
                type="button"
                onClick={() => onUpload(value.filter((_, idx) => idx !== i))}
                className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white shadow"
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
            <div key={i} className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-600 truncate max-w-[65%]">{u.name}</span>
                <span className={`text-xs font-semibold ${u.error ? 'text-red-500' : u.done ? 'text-green-600' : 'text-gray-400'}`}>
                  {u.error ? 'Failed' : u.done ? 'Done ✓' : u.progress === -1 ? 'Uploading...' : u.progress === 0 ? 'Starting...' : `${u.progress}%`}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                {u.progress === -1 ? (
                  /* Indeterminate shimmer during server upload */
                  <div className="h-full w-full relative overflow-hidden rounded-full bg-red-100">
                    <div className="absolute inset-y-0 w-1/2 brand-gradient animate-[shimmer_1.2s_ease-in-out_infinite]"
                      style={{ animation: 'shimmer 1.2s ease-in-out infinite' }} />
                  </div>
                ) : (
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      u.error ? 'bg-red-400' : u.done ? 'bg-green-500' : 'brand-gradient'
                    }`}
                    style={{ width: `${Math.max(0, u.progress)}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {value.length < MAX_PHOTOS && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm text-gray-500 hover:border-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-red-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Take / Upload Photo ({value.length}/{MAX_PHOTOS})
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }}
          />
        </>
      )}

      {displayError && <p className="text-xs text-red-600 mt-1">{displayError}</p>}
    </div>
  );
}
