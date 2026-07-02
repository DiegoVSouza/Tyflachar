import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from 'hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('first', 300));
    expect(result.current).toBe('first');
  });

  it('does not update the value before the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe('first');
  });

  it('updates the value once the delay has fully elapsed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('second');
  });

  it('resets the timer on rapid successive changes (only the last value wins)', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    rerender({ value: 'c' });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Only 150ms elapsed since the last change ('c') — still debounced.
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current).toBe('c');
  });

  it('defaults the delay to 400ms when not provided', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'x' },
    });

    rerender({ value: 'y' });
    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(result.current).toBe('x');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('y');
  });
});
