/**
 * A generic interface for key-value storage operations.
 *
 * @template T - The type of entity being stored. Defaults to `Entity`.
 */
export interface Storage<T = Entity> {
  /**
   * Retrieves an entity from storage by its key.
   *
   * @param key - The key associated with the entity.
   */
  get: (key: string) => Promise<T | null>

  /**
   * Stores an entity in storage with an optional metadata object.
   *
   * NOTE: This is not atomic operation, so concurrent writes may result in data loss.
   *
   * @param key - The key under which the entity is stored.
   * @param entity - The entity to store.
   * @param metadata - Optional metadata associated with the entity.
   */
  put: (key: string, entity: T, metadata?: { [key: string]: string }) => Promise<void>

  /**
   * Deletes an entity from storage by its key.
   *
   * @param key - The key of the entity to delete.
   */
  delete: (key: string) => Promise<void>
}

/**
 * Represents an entity that is stored, which must include a URL.
 */
export type Entity = {
  url: string
}

/**
 * An implementation of the `Storage` interface using Cloudflare KV storage.
 * This implementation is stateless and can be used across multiple requests.
 *
 * @template T - The type of entity being stored. Defaults to `Entity`.
 */
export class KVStorage<T = Entity> implements Storage<T> {
  // Cloudflare KVNamespace instance for performing storage operations
  private readonly storage: KVNamespace

  /**
   * Creates an instance of KVStorage.
   *
   * @param storage - A Cloudflare KVNamespace instance.
   */
  constructor(storage: KVNamespace) {
    this.storage = storage
  }

  /**
   * Retrieves an entity from KV storage.
   *
   * @param key - The key of the entity to retrieve.
   */
  async get(key: string): Promise<T | null> {
    const entity = await this.storage.get(key)

    // return null explicitly if no data is found
    if (entity === null) {
      return null
    }

    // parse the stored JSON string and ensure it satisfies type `T`
    return JSON.parse(entity) satisfies T
  }

  /**
   * Stores an entity in KV storage with optional metadata.
   *
   * @param key - The key under which the entity is stored.
   * @param entity - The entity to store.
   * @param metadata - Optional metadata for additional context.
   */
  async put(key: string, entity: T, metadata?: { [key: string]: string }): Promise<void> {
    return this.storage.put(key, JSON.stringify(entity), { metadata })
  }

  /**
   * Deletes an entity from KV storage.
   *
   * @param key - The key of the entity to delete.
   */
  async delete(key: string): Promise<void> {
    return this.storage.delete(key)
  }
}
