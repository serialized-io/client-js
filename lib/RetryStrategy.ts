import {ConfigurationError, isSerializedApiError} from "./error";

export class RetryStrategy {
  private static MAX_RETRY_COUNT = 10;
  private static MAX_SLEEP_MS = 10000;

  constructor(private retryCount: number, private sleep: number) {
    if (retryCount < 0 || retryCount > RetryStrategy.MAX_RETRY_COUNT) {
      throw new ConfigurationError(`retryCount must be between 0 and ${RetryStrategy.MAX_RETRY_COUNT}`)
    }
    if (sleep < 0 || sleep > RetryStrategy.MAX_SLEEP_MS) {
      throw new ConfigurationError(`sleep must be between 0 and ${RetryStrategy.MAX_SLEEP_MS}`)
    }
  }

  async executeWithRetries<T>(fn: () => Promise<T>): Promise<T> {
    let lastError;
    for (let i = 0; i <= this.retryCount; i++) {
      try {
        return await fn();
      } catch (error) {
        if (isSerializedApiError(error) && error.statusCode === 409) {
          lastError = error;
          await new Promise(resolve => setTimeout(resolve, this.sleep));
        } else {
          throw error;
        }
      }
    }
    throw lastError;
  }
}
