'use client';

import { useEffect, useRef, useState } from 'react';

interface CameraStreamProps {
  wsUrl: string;
}

export const CameraStream = ({ wsUrl }: CameraStreamProps) => {
  const ws = useRef<WebSocket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [imageData, setImageData] = useState<string>('');

  useEffect(() => {
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setImageData(`data:image/jpeg;base64,${data.data}`);
    };

    return () => {
      ws.current?.close();
    };
  }, [wsUrl]);

  const startStream = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ command: 'stream' }));
      setIsStreaming(true);
    }
  };

  const captureImage = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ command: 'capture' }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={startStream}
          disabled={isStreaming}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isStreaming ? 'Streaming...' : 'Start Stream'}
        </button>
        <button
          onClick={captureImage}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Capture Image
        </button>
      </div>
      {imageData && (
        <img
          src={imageData}
          alt="Camera Feed"
          className="w-full max-w-2xl border rounded-lg shadow-lg"
        />
      )}
    </div>
  );
};