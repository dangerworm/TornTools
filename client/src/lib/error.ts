export function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object' && 'message' in e) {
    const message = (e as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
