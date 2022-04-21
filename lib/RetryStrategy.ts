import {ConfigurationError, isSerializedApiError} from "./error";

/**
 * A retry strategy for performing different retry schemes and handling different server/client errors and simplifying application logic.
 */
export interface RetryStrategy {
  /**
   * Executed the target function with retries. If the function does not succeed within the scope of the retry strategy, this function will throw error received in the last performed attempt.
   *
   * @param fn the target function to execute for each try.
   */
  executeWithRetries<T>(fn: () => Promise<T>): Promise<T>
}

/**
 * Performs no retries, but tries invoking the target function once.
 */
export class NoRetryStrategy implements RetryStrategy {
  async executeWithRetries<T>(fn: () => Promise<T>): Promise<T> {
    return await fn();
  }
}

/**
 * Retries up to the maximum number of retries with a specified constant delay between each retry attempt.
 */
export class LinearRetryStrategy implements RetryStrategy {
  private static MAX_RETRY_COUNT = 10;
  private static MAX_SLEEP_MS = 10000;

  /**
   * @param retryCount the maximum number of retries
   * @param sleep the delay between each attempt (in milliseconds)
   */
  constructor(private retryCount: number, private sleep: number) {
    if (retryCount < 0 || retryCount > LinearRetryStrategy.MAX_RETRY_COUNT) {
      throw new ConfigurationError(`retryCount must be between 0 and ${LinearRetryStrategy.MAX_RETRY_COUNT}`)
    }
    if (sleep < 0 || sleep > LinearRetryStrategy.MAX_SLEEP_MS) {
      throw new ConfigurationError(`sleep must be between 0 and ${LinearRetryStrategy.MAX_SLEEP_MS}`)
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
