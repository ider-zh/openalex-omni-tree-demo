interface QueuedTask<T> {
  executor: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export class RequestQueue {
  private queue: QueuedTask<any>[] = [];
  private running = 0;
  private concurrency: number;

  constructor(concurrency = 4) {
    this.concurrency = concurrency;
  }

  async add<T>(executor: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ executor, resolve, reject });
      this.runNext();
    });
  }

  private runNext() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;

    this.running++;
    const task = this.queue.shift()!;

    task.executor()
      .then(task.resolve)
      .catch(task.reject)
      .finally(() => {
        this.running--;
        this.runNext();
      });
  }

  get pending(): number {
    return this.queue.length;
  }

  get active(): number {
    return this.running;
  }
}

export const csvFetchQueue = new RequestQueue(4);
