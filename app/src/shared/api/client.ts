import { API_BASE_URL } from '@/shared/config';

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  token?: string;
};

/** Minimal typed fetch wrapper: JSON in/out, Bearer auth, throws on non-2xx. */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}
