import { EventToPost } from "../types/config";

/**
 * Buffers events and flushes them periodically.
 */
export class EventBuffer {
  private buffer: EventToPost[] = [];
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private flushInterval: number,
    private flushCallback: (events: EventToPost[]) => void
  ) { }

  /**
   * Start the buffer timer.
   */
  start(): void {
    this.running = true;
    this.scheduleFlush();
  }

  /**
   * Stop the buffer and flush remaining events.
   */
  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.flush();
  }

  /**
   * Add an event to the buffer.
   */
  addEvent(eventValues: EventToPost[]): void {
    for (const event of eventValues) {
      this.buffer.push(event);
    }
  }

  private scheduleFlush(): void {
    if (this.running) {
      this.timer = setTimeout(() => {
        this.flush();
        this.scheduleFlush();
      }, this.flushInterval * 1000);
    }
  }

  private flush(): void {
    if (this.buffer.length > 0) {
      const events = this.buffer;
      this.buffer = [];
      this.flushCallback(events);
    }
  }
}
