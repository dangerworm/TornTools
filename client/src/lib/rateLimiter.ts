// src/lib/rateLimiter.ts
// Simple queue: runs one task every `intervalMs`
export function createRateLimiter(intervalMs: number) {
  type Task = {
    run: () => Promise<unknown>;
    resolve: (v: unknown) => void;
    reject: (e: unknown) => void;
  };

  const q: Task[] = [];
  let timer: number | null = null;

  const tick = async () => {
    if (!q.length) return;
    const task = q.shift()!;
    try {
      const res = await task.run();
      task.resolve(res);
    } catch (e) {
      task.reject(e);
    }
    if (q.length === 0) {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    }
  };

  const enqueue = <T>(run: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      // Widen to our internal Task shape and cast back on resolve
      const rejectUnknown = reject as (reason?: unknown) => void;

      q.push({
        run: () => run() as Promise<unknown>,
        resolve: (v: unknown) => resolve(v as T),
        reject: (e: unknown) => rejectUnknown(e),
      });

      if (timer === null) {
        timer = window.setInterval(tick, intervalMs);
        void tick(); // kick immediately so first task doesn't wait
      }
    });

  return { enqueue };
}
