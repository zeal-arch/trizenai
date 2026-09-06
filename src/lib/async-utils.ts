export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500,
  backoff = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * backoff, backoff);
  }
}

export class RequestQueue {
  private queue: (() => Promise<unknown>)[] = [];
  private concurrency: number;
  private running = 0;

  constructor(concurrency = 3) {
    this.concurrency = concurrency;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private process() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.running++;
        task().finally(() => {
          this.running--;
          this.process();
        });
      }
    }
  }
}
