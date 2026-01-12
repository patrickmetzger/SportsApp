'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

export default function ProgramQRCode({ programId }: { programId: string }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    // Get the full URL on the client side
    const fullUrl = `${window.location.origin}/programs/${programId}`;
    setUrl(fullUrl);
  }, [programId]);

  if (!url) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-white p-4 rounded-lg">
      <QRCode value={url} size={200} />
    </div>
  );
}
