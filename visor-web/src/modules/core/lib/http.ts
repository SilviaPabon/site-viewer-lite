// The only place that talks HTTP: adds the token and turns every failure into a readable message.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    if (init.signal?.aborted) throw err;
    throw new ApiError(0, NETWORK_ERROR);
  }
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

export const NETWORK_ERROR = "Can't reach the server. Check your connection.";

/** The API always answers { error, message } (Part A); anything else gets a generic text. */
export async function toApiError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as {
    message?: unknown;
  } | null;
  const message =
    typeof body?.message === "string"
      ? body.message
      : `Request failed (${res.status})`;
  return new ApiError(res.status, message);
}
