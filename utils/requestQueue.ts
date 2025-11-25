/**
 * Request Queue Manager
 * Prevents "Too many simultaneous invocations" error from Google Apps Script
 * by queuing requests and processing them sequentially with retry logic
 */

type QueuedRequest = {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retries: number;
  maxRetries: number;
};

class RequestQueueManager {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private readonly delayBetweenRequests = 100; // Reduced to 100ms
  private readonly maxRetries = 2; // Reduced to 2 retries
  private activeRequests = 0;
  private readonly maxConcurrentRequests = 2; // Allow 2 concurrent requests

  async enqueue<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: `req_${Date.now()}_${Math.random()}`,
        execute: requestFn,
        resolve,
        reject,
        retries: 0,
        maxRetries,
      };

      this.queue.push(request);
      this.processQueue();
    });
  }

  private async processQueue() {
    // Allow multiple concurrent requests
    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const request = this.queue.shift();
      if (!request) break;

      this.activeRequests++;
      this.executeRequest(request);
    }
  }

  private async executeRequest(request: QueuedRequest) {
    try {
      const result = await request.execute();
      request.resolve(result);
      
      // Small delay only between requests
      await this.delay(this.delayBetweenRequests);
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      const isConcurrencyError = 
        errorMessage.includes('invocaciones simultáneas') ||
        errorMessage.includes('simultaneous invocations') ||
        errorMessage.includes('Service invoked too many times') ||
        errorMessage.includes('Hojas de cálculo');

      if (isConcurrencyError && request.retries < request.maxRetries) {
        // Retry with backoff
        request.retries++;
        const backoffDelay = 500 * request.retries; // 500ms, 1000ms
        
        console.log(`Retrying request ${request.id} (attempt ${request.retries}/${request.maxRetries}) after ${backoffDelay}ms`);
        
        await this.delay(backoffDelay);
        this.queue.unshift(request); // Put back at front of queue
      } else {
        request.reject(error);
      }
    } finally {
      this.activeRequests--;
      // Process next request in queue
      this.processQueue();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getActiveRequests(): number {
    return this.activeRequests;
  }

  clear() {
    this.queue.forEach(req => req.reject(new Error('Queue cleared')));
    this.queue = [];
  }
}

// Singleton instance
export const requestQueue = new RequestQueueManager();
