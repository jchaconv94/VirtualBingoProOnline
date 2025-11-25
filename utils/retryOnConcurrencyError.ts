export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  shouldRetry?: (message?: string) => boolean;
  onRetry?: (attempt: number, message?: string) => void;
}

const defaultMessages = [
  'invocaciones simultáneas',
  'simultaneous invocations',
  'service invoked too many times',
  'hojas de cálculo',
  'too many concurrent requests',
];

const defaultShouldRetry = (message?: string) => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return defaultMessages.some(pattern => normalized.includes(pattern));
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function retryOnConcurrencyError<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 2,
    baseDelayMs = 400,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      const message = typeof error === 'string' ? error : error?.message;
      if (!shouldRetry(message) || attempt >= maxRetries) {
        throw error;
      }

      attempt += 1;
      const waitMs = baseDelayMs * attempt;
      onRetry?.(attempt, message);
      await delay(waitMs);
    }
  }
}

export const isConcurrencyErrorMessage = (message?: string): boolean => {
  return defaultShouldRetry(message);
};
