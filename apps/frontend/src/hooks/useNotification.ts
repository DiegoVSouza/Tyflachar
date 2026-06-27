import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification, removeNotification } from 'store/slices/uiSlice';
import type { AppDispatch } from 'store';
import type { NotificationType } from 'types';

interface NotifyApi {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warn: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

interface UseNotificationReturn {
  notify: NotifyApi;
  dismiss: (id: number) => void;
}

export function useNotification(): UseNotificationReturn {
  const dispatch = useDispatch<AppDispatch>();

  const show = useCallback(
    (type: NotificationType, message: string, duration?: number): void => {
      dispatch(addNotification({ type, message, duration }));
    },
    [dispatch]
  );

  const dismiss = useCallback(
    (id: number): void => { dispatch(removeNotification(id)); },
    [dispatch]
  );

  return {
    notify: {
      success: (msg, dur) => show('success', msg, dur),
      error: (msg, dur) => show('error', msg, dur),
      warn: (msg, dur) => show('warning', msg, dur),
      info: (msg, dur) => show('info', msg, dur),
    },
    dismiss,
  };
}
