import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient, { ApiError } from 'services/api/apiClient';
import { tokenStorage } from 'services/utils/tokenStorage';

function jsonResponse(body: unknown, init: { status?: number; ok?: boolean } = {}): Response {
  const status = init.status ?? 200;
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

function textResponse(body: string, init: { status?: number; ok?: boolean } = {}): Response {
  const status = init.status ?? 200;
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    headers: new Headers({ 'content-type': 'text/plain' }),
    json: () => Promise.reject(new Error('not json')),
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

/** A fetch mock that never settles on its own but rejects with an AbortError
 *  as soon as the request signal is aborted — mirroring real fetch behavior. */
function abortableHangingFetch(): typeof fetch {
  return vi.fn().mockImplementation((_url: string, opts: RequestInit = {}) => {
    return new Promise((_resolve, reject) => {
      opts.signal?.addEventListener('abort', () => {
        const err = new Error('The operation was aborted.');
        err.name = 'AbortError';
        reject(err);
      });
    });
  }) as unknown as typeof fetch;
}

describe('ApiError', () => {
  it('stores message, status and data, and preserves the Error prototype chain', () => {
    const error = new ApiError('Something broke', 500, { detail: 'x' });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('ApiError');
    expect(error.message).toBe('Something broke');
    expect(error.status).toBe(500);
    expect(error.data).toEqual({ detail: 'x' });
  });

  it('defaults data to null when not provided', () => {
    const error = new ApiError('No data', 400);
    expect(error.data).toBeNull();
  });
});

describe('apiClient HTTP methods', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('get() issues a GET request and returns parsed JSON', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ id: 1 }));

    const result = await apiClient.get<{ id: number }>('/users/1');

    expect(result).toEqual({ id: 1 });
    const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toContain('/users/1');
    expect(options.method).toBe('GET');
  });

  it('post() sends a JSON-serialized body and correct headers', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient.post('/users', { name: 'Ana' });

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify({ name: 'Ana' }));
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['Accept']).toBe('application/json');
  });

  it('post() omits the body when none is provided', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient.post('/ping');

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(options.body).toBeUndefined();
  });

  it('put() sends method PUT with a JSON body', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient.put('/users/1', { name: 'Bea' });

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(options.method).toBe('PUT');
    expect(options.body).toBe(JSON.stringify({ name: 'Bea' }));
  });

  it('patch() sends method PATCH with a JSON body', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient.patch('/users/1', { active: false });

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(options.method).toBe('PATCH');
    expect(options.body).toBe(JSON.stringify({ active: false }));
  });

  it('delete() issues a DELETE request', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse(null));

    await apiClient.delete('/users/1');

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(options.method).toBe('DELETE');
  });

  it('injects the Authorization header when a token is stored', async () => {
    tokenStorage.setToken('my-jwt');
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient.get('/me');

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(options.headers['Authorization']).toBe('Bearer my-jwt');
  });

  it('does not send an Authorization header when there is no token', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient.get('/me');

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('parses a non-JSON (text) response body', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(textResponse('plain body'));

    const result = await apiClient.get('/raw');

    expect(result).toBe('plain body');
  });
});

describe('apiClient error handling', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws ApiError with the server message when the response is not ok', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ message: 'Custom failure' }, { status: 422, ok: false })
    );

    await expect(apiClient.get('/fail')).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      message: 'Custom failure',
    });
  });

  it('falls back to the `error` field when `message` is absent', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ error: 'Bad input' }, { status: 400, ok: false })
    );

    await expect(apiClient.get('/fail')).rejects.toMatchObject({ message: 'Bad input' });
  });

  it('falls back to the first item of `errors` when message/error are absent', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ errors: [{ message: 'Field invalid' }] }, { status: 400, ok: false })
    );

    await expect(apiClient.get('/fail')).rejects.toMatchObject({ message: 'Field invalid' });
  });

  it('falls back to a default message per status code when the body has none', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({}, { status: 404, ok: false })
    );

    await expect(apiClient.get('/missing')).rejects.toMatchObject({
      status: 404,
      message: 'Resource not found.',
    });
  });

  it('wraps a network failure (fetch rejection) into an ApiError with status 0', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiClient.get('/anything')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: 'Falha na conexão. Verifique sua internet.',
    });
  });

  it('re-throws ApiError instances unchanged instead of re-wrapping them', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ message: 'Forbidden' }, { status: 403, ok: false })
    );

    await expect(apiClient.get('/secure')).rejects.toMatchObject({
      status: 403,
      message: 'Forbidden',
    });
  });
});

describe('apiClient timeout / abort handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aborts the request and throws ApiError once the timeout elapses', async () => {
    globalThis.fetch = abortableHangingFetch();

    await expect(apiClient.get('/slow', { timeout: 20 })).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: 'Requisição cancelada.',
    });
  });

  it('does not time out when the response resolves before the timeout', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ fast: true }));

    const result = await apiClient.get('/fast', { timeout: 5000 });

    expect(result).toEqual({ fast: true });
  });

  it('propagates abort from an external signal', async () => {
    globalThis.fetch = abortableHangingFetch();
    const controller = new AbortController();

    const pending = apiClient.get('/slow', { signal: controller.signal, timeout: 5000 });
    controller.abort(new Error('cancelled by caller'));

    await expect(pending).rejects.toMatchObject({ name: 'ApiError', status: 0 });
  });
});

describe('apiClient.upload', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a FormData body via POST without a Content-Type header', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ url: 'x.png' }));
    const formData = new FormData();
    formData.append('file', new Blob(['data']), 'file.png');

    const result = await apiClient.upload('/uploads', formData);

    expect(result).toEqual({ url: 'x.png' });
    const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toContain('/uploads');
    expect(options.method).toBe('POST');
    expect(options.body).toBe(formData);
    expect(options.headers['Content-Type']).toBeUndefined();
  });

  it('includes the Authorization header on upload when a token is present', async () => {
    tokenStorage.setToken('upload-jwt');
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient.upload('/uploads', new FormData());

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(options.headers['Authorization']).toBe('Bearer upload-jwt');
    tokenStorage.clearTokens();
  });
});
