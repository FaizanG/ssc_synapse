import type { ApiErrorResponse } from "@ssc/contracts";

export class SscApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorResponse,
  ) {
    super(body.message);
  }
}

export function createApiClient(options: {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
}) {
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  return {
    async request<T>(path: string, init?: RequestInit): Promise<T> {
      const response = await fetchImplementation(`${options.baseUrl}${path}`, {
        ...init,
        credentials: "include",
        headers: { Accept: "application/json", ...init?.headers },
      });
      if (!response.ok)
        throw new SscApiError(
          response.status,
          (await response.json()) as ApiErrorResponse,
        );
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    },
  };
}
