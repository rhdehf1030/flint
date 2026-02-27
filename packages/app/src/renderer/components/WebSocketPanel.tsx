import React, { useState, useRef, useEffect } from 'react';

interface WsMessage {
  direction: 'sent' | 'received' | 'system';
  content: string;
  timestamp: string;
}

export function WebSocketPanel(): React.ReactElement {
  const [url, setUrl] = useState('ws://localhost:8080');
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [input, setInput] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMsg = (msg: WsMessage) => setMessages((prev) => [...prev, msg]);

  const connect = () => {
    if (wsRef.current) return;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      addMsg({ direction: 'system', content: `Connecting to ${url}…`, timestamp: now() });

      ws.onopen = () => {
        setConnected(true);
        addMsg({ direction: 'system', content: 'Connected', timestamp: now() });
      };
      ws.onmessage = (e) => {
        addMsg({ direction: 'received', content: String(e.data), timestamp: now() });
      };
      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        addMsg({ direction: 'system', content: 'Disconnected', timestamp: now() });
      };
      ws.onerror = () => {
        addMsg({ direction: 'system', content: 'Connection error', timestamp: now() });
      };
    } catch (err) {
      addMsg({ direction: 'system', content: `Error: ${String(err)}`, timestamp: now() });
    }
  };

  const disconnect = () => {
    wsRef.current?.close();
  };

  const send = () => {
    if (!wsRef.current || !input.trim()) return;
    wsRef.current.send(input);
    addMsg({ direction: 'sent', content: input, timestamp: now() });
    setInput('');
  };

  const dirColor: Record<WsMessage['direction'], string> = {
    sent: '#89b4fa',
    received: '#a6e3a1',
    system: '#585b70',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* URL + controls */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid #313244' }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={connected}
          style={{
            flex: 1, background: '#313244', color: '#cdd6f4',
            border: '1px solid #45475a', borderRadius: 4,
            padding: '4px 10px', fontSize: 13, fontFamily: 'monospace', outline: 'none',
          }}
        />
        {!connected ? (
          <button
            onClick={connect}
            style={{
              background: '#a6e3a1', color: '#1e1e2e', border: 'none',
              borderRadius: 4, padding: '4px 14px', fontSize: 12,
              fontWeight: 'bold', cursor: 'pointer',
            }}
          >
            Connect
          </button>
        ) : (
          <button
            onClick={disconnect}
            style={{
              background: '#f38ba8', color: '#1e1e2e', border: 'none',
              borderRadius: 4, padding: '4px 14px', fontSize: 12,
              fontWeight: 'bold', cursor: 'pointer',
            }}
          >
            Disconnect
          </button>
        )}
        <span style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: connected ? '#a6e3a1' : '#585b70',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? '#a6e3a1' : '#585b70', flexShrink: 0,
          }} />
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Message log */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8, fontFamily: 'monospace', fontSize: 12 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 3, display: 'flex', gap: 8 }}>
            <span style={{ color: '#45475a', flexShrink: 0 }}>{msg.timestamp}</span>
            <span style={{ color: dirColor[msg.direction], flexShrink: 0 }}>
              {msg.direction === 'sent' ? '→' : msg.direction === 'received' ? '←' : '·'}
            </span>
            <span style={{ color: '#cdd6f4', wordBreak: 'break-all' }}>{msg.content}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Send input */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderTop: '1px solid #313244' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Message to send..."
          disabled={!connected}
          style={{
            flex: 1, background: '#313244', color: '#cdd6f4',
            border: '1px solid #45475a', borderRadius: 4,
            padding: '4px 10px', fontSize: 12, fontFamily: 'monospace', outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={!connected || !input.trim()}
          style={{
            background: connected && input.trim() ? '#89b4fa' : '#45475a',
            color: '#1e1e2e', border: 'none', borderRadius: 4,
            padding: '4px 14px', fontSize: 12, fontWeight: 'bold',
            cursor: connected && input.trim() ? 'pointer' : 'default',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function now(): string {
  return new Date().toLocaleTimeString();
}
