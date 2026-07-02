import { useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Message, ConversationId } from 'types';
import { selectSelectedConversationId, selectConversations } from 'store/slices/conversationSlice';

// "New message" toasts driven by conversationToastBus (fed from hooks/useWebSocket.ts).
// Unrelated to useToastNotification (generic app banners via uiSlice/Redux).

export interface ToastItem {
  id: number;
  message: string;
  clientName: string;
  conversationId: ConversationId;
}

type Handler = (_conversationId: ConversationId, _message: Message) => void;
const handlers = new Set<Handler>();

export const conversationToastBus = {
  emit(conversationId: ConversationId, message: Message) {
    handlers.forEach((h) => h(conversationId, message));
  },
  subscribe(handler: Handler) {
    handlers.add(handler);
    return () => handlers.delete(handler);
  },
};

let toastIdCounter = 0;
const TOAST_DURATION_MS = 5000;

export function useConversationToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const selectedConversationId = useSelector(selectSelectedConversationId);
  const conversations = useSelector(selectConversations);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = conversationToastBus.subscribe((conversationId, message) => {
      if (conversationId === selectedConversationId) return;

      const conversation = conversations.find((c) => c.id === conversationId);
      const clientName = conversation?.client_name ?? 'Cliente';

      const id = ++toastIdCounter;
      const newToast: ToastItem = {
        id,
        message: message.content,
        clientName,
        conversationId,
      };

      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    });

    return () => { unsubscribe(); };
  }, [selectedConversationId, conversations, dismissToast]);

  return { toasts, dismissToast };
}
