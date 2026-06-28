import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from 'store';
import type { WsEvent, WsStatus, Message, Appointment, ConversationId } from 'types';
import { receiveMessage } from 'store/slices/conversationSlice';
import { receiveNewAppointment } from 'store/slices/appointmentSlice';

const WS_BASE = import.meta.env['VITE_WS_URL'] ?? 'ws://localhost:8080';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

function extractBranchId(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    return String(payload.branch_id ?? '');
  } catch {
    return null;
  }
}

export function useWebSocket(token: string | null): { wsStatus: WsStatus } {
  const dispatch = useDispatch<AppDispatch>();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmounting = useRef(false);
  const [wsStatus, setWsStatus] = useState<WsStatus>('disconnected');

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data: WsEvent = JSON.parse(event.data as string);
        switch (data.type) {
          case 'new_message': {
            const { conversationId, message } = data.payload as {
              conversationId: ConversationId;
              message: Message;
            };
            dispatch(receiveMessage({ conversationId, message }));
            break;
          }
          case 'new_appointment':
            dispatch(receiveNewAppointment(data.payload as Appointment));
            break;
          default:
            break;
        }
      } catch {
        // malformed message
      }
    },
    [dispatch]
  );

  const connect = useCallback(() => {
    if (!token || isUnmounting.current) return;

    const branchId = extractBranchId(token);
    if (!branchId) return;

    setWsStatus('connecting');
    const url = `${WS_BASE}/ws/${branchId}?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempts.current = 0;
      setWsStatus('connected');
    };

    ws.onmessage = handleMessage;

    ws.onerror = () => {
      setWsStatus('error');
    };

    ws.onclose = () => {
      if (isUnmounting.current) return;
      setWsStatus('disconnected');
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current += 1;
        reconnectTimeout.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };
  }, [token, handleMessage]);

  useEffect(() => {
    isUnmounting.current = false;
    connect();

    return () => {
      isUnmounting.current = true;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { wsStatus };
}
