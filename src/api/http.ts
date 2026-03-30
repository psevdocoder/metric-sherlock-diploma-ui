import { env } from '../config/env';
import { convertRequestCase, normalizeResponseCase } from '../utils/jsonCase';

type QueryParams = object;

interface ApiRequestOptions {
  method?: 'GET' | 'PUT' | 'DELETE';
  query?: QueryParams;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function buildUrl(path: string, query?: QueryParams): string {
  const baseUrl = env.api_base_url || window.location.origin;
  const url = new URL(path, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return env.api_base_url ? url.toString() : `${url.pathname}${url.search}`;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return {};
  }

  const rawText = await response.text();

  if (!rawText) {
    return {};
  }

  try {
    return normalizeResponseCase(JSON.parse(rawText));
  } catch {
    return rawText;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers({
    Accept: 'application/json',
  });

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  let body: string | undefined;
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(convertRequestCase(options.body, env.api_request_case));
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body,
    signal: options.signal,
  });

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    const message =
      typeof responseBody === 'string'
        ? responseBody
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, responseBody);
  }

  return responseBody as T;
}
