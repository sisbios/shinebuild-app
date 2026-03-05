'use client';

import { useState } from 'react';
import { Button } from '@shinebuild/ui';
import { exportReport } from './actions';

export function ExportButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await exportReport();
      if (result.error) { setError(result.error); return; }
      // Trigger CSV download
      const blob = new Blob([result.csv!], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shinebuild-leads-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button size="sm" loading={loading} onClick={handle}>
        Export CSV
      </Button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
