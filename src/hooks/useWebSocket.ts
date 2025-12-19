/**
 * WebSocket Hook for Real-Time Updates
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { createWebSocket } from '../lib/api';

interface UseWebSocketOptions {
  channel: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket<T = any>(options: UseWebSocketOptions) {
  const { channel, autoReconnect = true, reconnectInterval = 3000 } = options;
  
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const connect = useCallback(() => {
    try {
      const ws = createWebSocket(channel);
      
      ws.onopen = () => {
        setConnected(true);
        setError(null);
        console.log(`✅ WebSocket connected to ${channel}`);
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setData(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError(new Error('WebSocket connection error'));
        setConnected(false);
      };
      
      ws.onclose = () => {
        setConnected(false);
        console.log(`❌ WebSocket disconnected from ${channel}`);
        
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Reconnecting to ${channel}...`);
            connect();
          }, reconnectInterval);
        }
      };
      
      wsRef.current = ws;
    } catch (err) {
      setError(err as Error);
      setConnected(false);
    }
  }, [channel, autoReconnect, reconnectInterval]);
  
  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);
  
  const send = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);
  
  return {
    connected,
    data,
    error,
    send,
  };
}

