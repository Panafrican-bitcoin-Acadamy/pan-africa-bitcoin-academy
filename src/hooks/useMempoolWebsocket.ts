import { useEffect, useState, useRef } from 'react';

// Mempool block (unconfirmed) interface
export interface MempoolBlock {
  blockSize: number;
  nTx: number;
  totalFees: number;
  medianFee: number;
  minFee: number;
  maxFee: number;
  feeRange: number[];
  virtualSize: number;
}

// Confirmed block interface
export interface ConfirmedBlock {
  height: number;
  id: string;
  timestamp: number;
  tx_count: number;
  size: number;
  weight: number;
  pool?: {
    id: string;
    name: string;
    slug: string;
  };
  extras?: {
    feeRange: number[];
    avgFee: number;
    totalFees: number;
  };
  fee?: number;
  fees?: number;
}

export default function useMempoolWebsocket() {
  const [mempoolBlocks, setMempoolBlocks] = useState<MempoolBlock[]>([]);
  const [recentBlocks, setRecentBlocks] = useState<ConfirmedBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;

    const connect = () => {
      try {
        const socket = new WebSocket('wss://mempool.space/api/v1/ws');
        socketRef.current = socket;

        socket.onopen = () => {
          reconnectAttempts = 0;
          if (!isMountedRef.current) return;
          
          // Subscribe to real-time data
          socket.send(JSON.stringify({
            action: 'want',
            'mempool-blocks': true,
            'blocks': true
          }));
          
          setLoading(false);
          setError(null);
        };

        socket.onmessage = (event) => {
          if (!isMountedRef.current) return;
          
          try {
            const data = JSON.parse(event.data);

            // Live mempool blocks
            if (data['mempool-blocks']) {
              const blocks = Array.isArray(data['mempool-blocks']) 
                ? data['mempool-blocks'] 
                : [];
              setMempoolBlocks(blocks.slice(0, 4));
            }

            // Live confirmed blocks
            if (data['blocks']) {
              const blocks = Array.isArray(data['blocks']) 
                ? data['blocks'] 
                : [];
              setRecentBlocks(blocks.slice(0, 4));
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        socket.onerror = (err) => {
          console.error('WebSocket error:', err);
          if (isMountedRef.current) {
            setError('WebSocket connection error');
          }
        };

        socket.onclose = () => {
          socketRef.current = null;
          
          if (!isMountedRef.current) return;
          
          // Auto reconnect with exponential backoff
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
            reconnectAttempts++;
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                console.log(`Reconnecting... (attempt ${reconnectAttempts})`);
                connect();
              }
            }, delay);
          } else {
            setError('Failed to connect after multiple attempts');
            setLoading(false);
          }
        };
      } catch (err) {
        console.error('Error creating WebSocket:', err);
        if (isMountedRef.current) {
          setError('Failed to establish WebSocket connection');
          setLoading(false);
        }
      }
    };

    // Initial connection
    connect();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  return { mempoolBlocks, recentBlocks, loading, error };
}
