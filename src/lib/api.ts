export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const contentType = res.headers.get("content-type") || "";

  const payload = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as { message?: unknown }).message ?? "")
        : res.statusText;
    throw new ApiError(message || "请求失败", res.status);
  }

  return payload as T;
}

