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
