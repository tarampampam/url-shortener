export interface Cache<TKey, TValue> {
  // Retrieves a value from the cache using the provided key.
  // Returns undefined if the key does not exist.
  get(key: TKey): TValue | undefined

  // Stores a key-value pair in the cache.
  put(key: TKey, value: TValue): void
}

/**
 * An in-memory cache implementation that stores key-value pairs in a Map.
 * Implementation is stateful (avoid recreating instances across requests).
 */
export class InMemory<TKey, TValue> implements Cache<TKey, TValue> {
  // Internal state to store key-value pairs in memory using a Map.
  protected readonly state: Map<TKey, TValue> = new Map()

  // Optional limit to the number of key-value pairs that can be stored. In theory, map can hold up to 48,408,186
  // entries.
  protected readonly limit: number

  constructor(limit: number = 0) {
    this.limit = limit
  }

  // Retrieves the value associated with the given key.
  // If the key is not found, returns undefined.
  public get(key: TKey): TValue | undefined {
    return this.state.get(key)
  }

  // Stores a key-value pair in the internal state.
  // If the key already exists, its value is updated.
  public put(key: TKey, value: TValue): void {
    // if the cache has a limit, check if we need to evict an entry.
    if (this.limit > 0 && this.state.size > this.limit) {
      // remove the first entry in the map.
      const firstKey = this.state.keys().next().value

      if (firstKey) {
        this.state.delete(firstKey)
      }
    }

    this.state.set(key, value)
  }
}
