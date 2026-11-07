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
    throw new ApiError(0, "Can't reach the server. Check your connection.");
  }
  if (!res.ok) {
    // The API always answers { error, message } (Part A); anything else gets a generic text.
    const body = (await res.json().catch(() => null)) as {
      message?: unknown;
    } | null;
    const message =
      typeof body?.message === "string"
        ? body.message
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}
