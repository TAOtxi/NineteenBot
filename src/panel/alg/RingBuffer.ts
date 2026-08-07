export default class RingBuffer<T> {
  private buffer: T[];
  private capacity: number;
  private head: number;
  private size: number;

  constructor(capacity: number) {
    this.buffer = new Array(capacity);
    this.capacity = capacity;
    this.head = 0;
    this.size = 0;
  }

  static create<T>(capacity: number) {
    return new RingBuffer<T>(capacity);
  }

  push(item: T) {
    const tail = (this.head + this.size) % this.capacity;
    this.buffer[tail] = item;
    if (this.size < this.capacity) {
      this.size++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  shift() {
    if (this.size === 0) return null;
    const item = this.buffer[this.head];
    this.buffer[this.head] = null as T;
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    return item;
  }

  clear() {
    this.head = 0;
    this.size = 0;
    this.buffer.fill(null as T);
  }

  getHeadIndex() {
    return this.head;
  }

  length() {
    return this.size;
  }

  getBuffer() {
    return this.buffer;
  }

  toLogicIndex(rawIndex: number) {
    while (rawIndex < 0) {
      rawIndex += this.capacity;
    }
    rawIndex = rawIndex % this.capacity;

    let index = rawIndex - this.head;
    if (index < 0) {
      index += this.capacity;
    }
    return index;
  }

  toRawIndex(logicIndex: number) {
    while (logicIndex < 0) {
      logicIndex += this.capacity;
    }
    if (logicIndex >= this.capacity) {
      logicIndex = logicIndex % this.capacity;
    }
    return (logicIndex + this.head) % this.capacity;
  }
}