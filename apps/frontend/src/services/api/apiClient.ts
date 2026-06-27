/**
 * apiClient.ts
 *
 * Typed HTTP client built on native fetch — no Axios, no external deps.
 *
 * Features:
 * - Automatic JWT injection
 * - Standard headers
 * - Typed error handling via ApiError
 * - AbortController / timeout support
 */

import { tokenStorage } from '../utils/tokenStorage';
import type { ApiErrorData } from 'types';

const BASE_URL: string = (process.env['REACT_APP_API_URL'] as string) ?? '';
const DEFAULT_TIMEOUT = Number(process.env['REACT_APP_API_TIMEOUT'] ?? 15_000);

// ─── ApiError ─────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    // Restore prototype chain (required when extending built-ins in TS)
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildHeaders(extraHeaders: HeadersInit = {}): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const token = tokenStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return { ...headers, ...(extraHeaders as Record<string, string>) };
}

async function handleResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  let data: unknown = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = extractErrorMessage(data as ApiErrorData | null, response.status);
    throw new ApiError(message, response.status, data);
  }

  return data;
}

function extractErrorMessage(data: ApiErrorData | null, status: number): string {
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (data?.errors?.[0]?.message) return data.errors[0].message;

  const defaults: Record<number, string> = {
    400: 'Invalid request.',
    401: 'Unauthorized. Please log in again.',
    403: 'You do not have permission to access this resource.',
    404: 'Resource not found.',
    409: 'Conflict: resource already exists.',
    422: 'Invalid data.',
    429: 'Too many requests. Please try again later.',
    500: 'Internal server error.',
    502: 'Service temporarily unavailable.',
    503: 'Service under maintenance.',
  };

  return defaults[status] ?? `Erro ${status}.`;
}

interface AbortHandle {
  signal: AbortSignal;
  cleanup: () => void;
}

function createAbortSignal(
  timeout: number = DEFAULT_TIMEOUT,
  externalSignal?: AbortSignal
): AbortHandle {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Timeout após ${timeout}ms`));
  }, timeout);

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => {
      controller.abort(externalSignal.reason);
    });
  }

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

// ─── Core request ─────────────────────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, 'signal'> {
  timeout?: number;
  signal?: AbortSignal;
}

async function request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeout, signal: externalSignal, headers: extraHeaders, ...fetchOptions } = options;
  const { signal, cleanup } = createAbortSignal(timeout, externalSignal);

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: buildHeaders(extraHeaders),
      signal,
    });

    return (await handleResponse(response)) as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Requisição cancelada.', 0);
    }
    if (error instanceof ApiError) throw error;
    // Network errors (no connection, CORS, etc.)
    throw new ApiError('Falha na conexão. Verifique sua internet.', 0);
  } finally {
    cleanup();
  }
}

// ─── Public interface ─────────────────────────────────────────────────────────

const apiClient = {
  get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { method: 'GET', ...options });
  },

  post<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  put<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  patch<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE', ...options });
  },

  upload<T = unknown>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const { headers: _, ...rest } = options ?? {};
    const token = tokenStorage.getToken();
    const uploadHeaders: Record<string, string> = {
      Accept: 'application/json',
      // Content-Type intentionally omitted — browser sets multipart boundary automatically
    };
    if (token) uploadHeaders['Authorization'] = `Bearer ${token}`;

    return request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: uploadHeaders,
      ...rest,
    });
  },
} as const;

export default apiClient;
