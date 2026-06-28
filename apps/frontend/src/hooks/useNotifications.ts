import { useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Mensagem, ConversaId } from 'types';
import { selectConversaSelecionadaId, selectConversas } from 'store/slices/conversationSlice';

export interface ToastItem {
  id: number;
  message: string;
  clientName: string;
  conversationId: ConversaId;
}

type Handler = (_conversaId: ConversaId, _mensagem: Mensagem) => void;
const handlers = new Set<Handler>();

export const notificationEventBus = {
  emit(conversaId: ConversaId, mensagem: Mensagem) {
    handlers.forEach((h) => h(conversaId, mensagem));
  },
  subscribe(handler: Handler) {
    handlers.add(handler);
    return () => handlers.delete(handler);
  },
};

let toastIdCounter = 0;
const TOAST_DURATION_MS = 5000;

export function useNotifications() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const selectedConversationId = useSelector(selectConversaSelecionadaId);
  const conversations = useSelector(selectConversas);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = notificationEventBus.subscribe((conversaId, mensagem) => {
      if (conversaId === selectedConversationId) return;

      const conversation = conversations.find((c) => c.id === conversaId);
      const clientName = conversation?.clienteNome ?? 'Cliente';

      const id = ++toastIdCounter;
      const newToast: ToastItem = {
        id,
        message: mensagem.conteudo,
        clientName,
        conversationId: conversaId,
      };

      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    });

    return () => { unsubscribe(); };
  }, [selectedConversationId, conversations, dismissToast]);

  return { toasts, dismissToast };
}
