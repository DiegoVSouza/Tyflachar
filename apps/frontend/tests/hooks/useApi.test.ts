import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useApi } from 'hooks/useApi';

describe('useApi', () => {
  it('starts with idle/empty state', () => {
    const { result } = renderHook(() => useApi(vi.fn()));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets isLoading while the call is in flight, then stores the result', async () => {
    let resolvePromise!: (value: { ok: boolean }) => void;
    const serviceMethod = vi.fn(
      () =>
        new Promise<{ ok: boolean }>((resolve) => {
          resolvePromise = resolve;
        })
    );

    const { result } = renderHook(() => useApi(serviceMethod));

    let executePromise!: Promise<unknown>;
    act(() => {
      executePromise = result.current.execute();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise({ ok: true });
      await executePromise;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual({ ok: true });
    expect(result.current.error).toBeNull();
  });

  it('forwards call arguments to the service method', async () => {
    const serviceMethod = vi.fn().mockResolvedValue('done');
    const { result } = renderHook(() => useApi(serviceMethod));

    await act(async () => {
      await result.current.execute('a', 2, { c: true });
    });

    expect(serviceMethod).toHaveBeenCalledWith('a', 2, { c: true });
  });

  it('stores the error message and returns null when the call rejects', async () => {
    const serviceMethod = vi.fn().mockRejectedValue(new Error('Request failed'));
    const { result } = renderHook(() => useApi(serviceMethod));

    let returned: unknown;
    await act(async () => {
      returned = await result.current.execute();
    });

    expect(returned).toBeNull();
    expect(result.current.error).toBe('Request failed');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('clears a previous error when a new execute() call starts', async () => {
    const serviceMethod = vi
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValueOnce('recovered');

    const { result } = renderHook(() => useApi(serviceMethod));

    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.error).toBe('First failure');

    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBe('recovered');
  });

  it('reset() clears data, error and loading state', async () => {
    const serviceMethod = vi.fn().mockResolvedValue('value');
    const { result } = renderHook(() => useApi(serviceMethod));

    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.data).toBe('value');

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('resolves execute() without throwing after the component unmounts', async () => {
    let resolvePromise!: (value: string) => void;
    const serviceMethod = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolvePromise = resolve;
        })
    );

    const { result, unmount } = renderHook(() => useApi(serviceMethod));

    let executePromise!: Promise<unknown>;
    act(() => {
      executePromise = result.current.execute();
    });

    unmount();
    resolvePromise('late value');

    // The in-flight promise still resolves to the value even though the
    // isMountedRef guard skips the setState calls — no error should be thrown.
    await expect(executePromise).resolves.toBe('late value');
  });
});
