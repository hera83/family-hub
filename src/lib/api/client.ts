import { env } from "@/config/env";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown
  ) {
    super(`API ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | null | undefined>;
};

async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, params, headers: extraHeaders, ...rest } = options;

  let url = `${env.apiBaseUrl}${path}`;

  if (params) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") sp.set(k, String(v));
    });
    const qs = sp.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    "x-api-key": env.apiKey,
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  const res = await fetch(url, {
    ...rest,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = await res.text().catch(() => null);
    }
    throw new ApiError(res.status, res.statusText, errorBody);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const api = {
  get: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
