import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from 'store';
import type { WsEvent, WsStatus, Mensagem, Agendamento, ConversaId } from 'types';
import { receberMensagem } from 'store/slices/conversationSlice';
import { receberNovoAgendamento } from 'store/slices/appointmentSlice';

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
  const [wsStatus, setWsStatus] = useState<WsStatus>('desconectado');

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data: WsEvent = JSON.parse(event.data as string);
        switch (data.tipo) {
          case 'nova_mensagem': {
            const { conversaId, mensagem } = data.payload as {
              conversaId: ConversaId;
              mensagem: Mensagem;
            };
            dispatch(receberMensagem({ conversaId, mensagem }));
            break;
          }
          case 'novo_agendamento':
            dispatch(receberNovoAgendamento(data.payload as Agendamento));
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

    setWsStatus('conectando');
    const url = `${WS_BASE}/ws/${branchId}?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempts.current = 0;
      setWsStatus('conectado');
    };

    ws.onmessage = handleMessage;

    ws.onerror = () => {
      setWsStatus('erro');
    };

    ws.onclose = () => {
      if (isUnmounting.current) return;
      setWsStatus('desconectado');
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
