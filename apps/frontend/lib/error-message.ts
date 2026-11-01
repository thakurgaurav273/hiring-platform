/**
 * Message to show for a failed API call. The axios interceptor rejects with a
 * plain Error whose message is the server's; raw axios errors carry it on
 * response.data.message.
 */
export function errorMessage(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { message?: unknown } }; message?: unknown } | null;
  const fromResponse = err?.response?.data?.message;
  if (typeof fromResponse === "string" && fromResponse.trim()) return fromResponse;
  if (typeof err?.message === "string" && err.message.trim() && !/^Request failed with status code/.test(err.message)) return err.message;
  return fallback;
}
