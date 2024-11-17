'use client';

import { useEffect, useRef, useState } from 'react';

interface CameraStreamProps {
  wsUrl: string;
}

export const CameraStream = ({ wsUrl }: CameraStreamProps) => {
  const ws = useRef<WebSocket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [imageData, setImageData] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.current.onclose = () => {
      setConnectionStatus('disconnected');
      setIsStreaming(false);
      setIsCapturing(false);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setImageData(`data:image/jpeg;base64,${data.data}`);
      if (data.type === 'image') {
        setIsCapturing(false);
      }
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

  const stopStream = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ command: 'stop_stream' }));
      setIsStreaming(false);
    }
  };

  const captureImage = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ command: 'capture' }));
      setIsCapturing(true);
    }
  };

  const stopCapture = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ command: 'stop_capture' }));
      setIsCapturing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-3 h-3 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500' :
          connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
        <span>{connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}</span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        <div className="space-y-2">
          <h3 className="font-medium">Live Stream</h3>
          <div className="flex gap-2">
            <button
              onClick={startStream}
              disabled={isStreaming || connectionStatus !== 'connected'}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Start Stream
            </button>
            <button
              onClick={stopStream}
              disabled={!isStreaming || connectionStatus !== 'connected'}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Stop Stream
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Still Image</h3>
          <div className="flex gap-2">
            <button
              onClick={captureImage}
              disabled={isCapturing || connectionStatus !== 'connected'}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Capture Image
            </button>
            <button
              onClick={stopCapture}
              disabled={!isCapturing || connectionStatus !== 'connected'}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Cancel Capture
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        {imageData ? (
          <img
            src={imageData}
            alt="Camera Feed"
            className="w-full max-w-2xl border rounded-lg shadow-lg"
          />
        ) : (
          <div className="w-full max-w-2xl h-[480px] bg-gray-100 border rounded-lg flex items-center justify-center text-gray-500">
            No image available
          </div>
        )}
        {(isStreaming || isCapturing) && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {isStreaming ? 'Streaming' : 'Capturing'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};