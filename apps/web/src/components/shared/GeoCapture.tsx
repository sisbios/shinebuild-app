'use client';

import { useState } from 'react';
import { Button } from '@shinebuild/ui';

export interface GeoData {
  lat: number;
  lng: number;
  accuracy: number;
  capturedAt: string;
}

interface Props {
  onCapture: (geo: GeoData) => void;
  value?: GeoData;
  error?: string;
}

export function GeoCapture({ onCapture, value, error }: Props) {
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  const capture = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onCapture({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          capturedAt: new Date().toISOString(),
        });
        setLoading(false);
      },
      (err) => {
        setGeoError(err.message ?? 'Failed to get location. Please allow location access.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const displayError = error ?? geoError;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Location <span className="text-red-500">*</span>
      </label>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
          <svg className="h-4 w-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-green-800">Location captured</p>
            <p className="text-xs text-green-600 truncate">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)} ± {Math.round(value.accuracy)}m
            </p>
          </div>
          <button
            onClick={capture}
            className="text-xs text-green-700 underline"
          >
            Refresh
          </button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="full"
          onClick={capture}
          loading={loading}
          type="button"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Capture My Location
        </Button>
      )}
      {displayError && <p className="text-xs text-red-600">{displayError}</p>}
      <p className="text-xs text-gray-400">
        Location is required to verify the meeting place
      </p>
    </div>
  );
}
