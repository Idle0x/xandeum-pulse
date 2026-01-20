export class LRUCache<K, V> {
  private max: number;
  private cache: Map<K, V>;

  constructor(max: number = 1000) {
    this.max = max;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item) {
      // Refresh: Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: K, value: V): void {
    // If exists, delete first to refresh position
    if (this.cache.has(key)) this.cache.delete(key);
    
    // If full, delete oldest (first item in Map)
    if (this.cache.size >= this.max) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }
}
