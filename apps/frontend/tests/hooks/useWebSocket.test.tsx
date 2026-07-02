import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestStore } from '../store/slices/testStore';
import { fetchMessages } from 'store/slices/conversationSlice';
import type { ConversationId } from 'types';
import { useWebSocket } from 'hooks/useWebSocket';

/** Minimal fake WebSocket — jsdom does not implement a real one. */
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
  }

  // test helpers — simulate server/browser events
  emitOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  emitMessage(payload: unknown): void {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  emitClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

function makeToken(branchId: string): string {
  const payload = btoa(JSON.stringify({ branch_id: branchId }));
  return `header.${payload}.signature`;
}

function renderUseWebSocket(token: string | null) {
  const store = createTestStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const view = renderHook(({ token: t }: { token: string | null }) => useWebSocket(t), {
    wrapper,
    initialProps: { token },
  });
  return { ...view, store };
}

describe('useWebSocket', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('does not open a connection when token is null', () => {
    const { result } = renderUseWebSocket(null);

    expect(MockWebSocket.instances).toHaveLength(0);
    expect(result.current.wsStatus).toBe('disconnected');
  });

  it('opens a connection carrying the branch id extracted from the JWT', () => {
    const token = makeToken('42');
    renderUseWebSocket(token);

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0]!.url).toContain('/ws/42');
    expect(MockWebSocket.instances[0]!.url).toContain(`token=${token}`);
  });

  it('transitions to connected once the socket opens', () => {
    const { result } = renderUseWebSocket(makeToken('1'));

    act(() => {
      MockWebSocket.instances[0]!.emitOpen();
    });

    expect(result.current.wsStatus).toBe('connected');
  });

  it('transitions to error when the socket errors', () => {
    const { result } = renderUseWebSocket(makeToken('1'));

    act(() => {
      MockWebSocket.instances[0]!.onerror?.();
    });

    expect(result.current.wsStatus).toBe('error');
  });

  it('reconnects with a backoff delay after the socket closes', () => {
    vi.useFakeTimers();
    const { result } = renderUseWebSocket(makeToken('1'));

    act(() => {
      MockWebSocket.instances[0]!.emitOpen();
      MockWebSocket.instances[0]!.emitClose();
    });

    expect(result.current.wsStatus).toBe('disconnected');
    expect(MockWebSocket.instances).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it('closes the socket and does not reconnect on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = renderUseWebSocket(makeToken('1'));
    const socket = MockWebSocket.instances[0]!;

    unmount();
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);

    act(() => {
      socket.emitClose();
      vi.advanceTimersByTime(5000);
    });

    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('dispatches new_message events to conversationSlice', () => {
    const { store } = renderUseWebSocket(makeToken('1'));
    const conversationId = 'c1' as ConversationId;
    store.dispatch({
      type: fetchMessages.fulfilled.type,
      payload: { id: conversationId, messages: [] },
    });

    act(() => {
      MockWebSocket.instances[0]!.emitMessage({
        type: 'new_message',
        payload: {
          conversationId,
          message: {
            id: 'm1',
            conversation_id: conversationId,
            direction: 'in',
            content: 'Hi there',
            type: 'text',
            status: 'received',
            timestamp: '2024-01-01T00:00:00.000Z',
          },
        },
      });
    });

    expect(store.getState().conversation.messages[conversationId]).toHaveLength(1);
    expect(store.getState().conversation.messages[conversationId]![0]!.content).toBe('Hi there');
  });

  it('dispatches new_appointment events to appointmentSlice', () => {
    const { store } = renderUseWebSocket(makeToken('1'));

    act(() => {
      MockWebSocket.instances[0]!.emitMessage({
        type: 'new_appointment',
        payload: {
          id: 'a1',
          client_name: 'Ana',
          service: 'Haircut',
          scheduled_at: '2024-01-02T14:00:00.000Z',
          status: 'pending',
        },
      });
    });

    expect(store.getState().appointment.appointments).toHaveLength(1);
    expect(store.getState().appointment.appointments[0]!.client_name).toBe('Ana');
  });

  it('ignores malformed message payloads without throwing', () => {
    const { store } = renderUseWebSocket(makeToken('1'));

    expect(() => {
      act(() => {
        MockWebSocket.instances[0]!.onmessage?.({ data: 'not-json' });
      });
    }).not.toThrow();

    expect(store.getState().appointment.appointments).toEqual([]);
  });
});
