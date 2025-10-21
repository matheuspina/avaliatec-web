/**
 * Simple in-memory cache utility for performance optimization
 * Used for caching frequently accessed data like instance settings
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes default TTL

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    }

    this.cache.set(key, entry)
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Clean expired entries
   */
  cleanup(): number {
    let cleaned = 0
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let expired = 0
    let valid = 0

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++
      } else {
        valid++
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired
    }
  }
}

// Global cache instance
const globalCache = new MemoryCache()

// Specific cache utilities for different data types

/**
 * Instance Settings Cache
 * Caches WhatsApp instance settings to reduce database queries
 */
export class InstanceSettingsCache {
  private static readonly CACHE_PREFIX = 'instance_settings:'
  private static readonly TTL = 10 * 60 * 1000 // 10 minutes

  static getCacheKey(instanceId: string): string {
    return `${this.CACHE_PREFIX}${instanceId}`
  }

  static get(instanceId: string) {
    return globalCache.get(this.getCacheKey(instanceId))
  }

  static set(instanceId: string, settings: any): void {
    globalCache.set(this.getCacheKey(instanceId), settings, this.TTL)
  }

  static delete(instanceId: string): boolean {
    return globalCache.delete(this.getCacheKey(instanceId))
  }

  static clear(): void {
    // Clear all instance settings from cache
    const keys = Array.from((globalCache as any).cache.keys()) as string[]
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        globalCache.delete(key)
      }
    })
  }
}

/**
 * Quick Messages Cache
 * Caches quick messages for faster autocomplete
 */
export class QuickMessagesCache {
  private static readonly CACHE_KEY = 'quick_messages:all'
  private static readonly TTL = 15 * 60 * 1000 // 15 minutes

  static get() {
    return globalCache.get(this.CACHE_KEY)
  }

  static set(quickMessages: any[]): void {
    globalCache.set(this.CACHE_KEY, quickMessages, this.TTL)
  }

  static delete(): boolean {
    return globalCache.delete(this.CACHE_KEY)
  }
}

/**
 * Contact List Cache
 * Short-term cache for contact lists to reduce API calls during rapid switching
 */
export class ContactListCache {
  private static readonly CACHE_PREFIX = 'contacts:'
  private static readonly TTL = 2 * 60 * 1000 // 2 minutes (short TTL for real-time data)

  static getCacheKey(instanceId: string, filters?: string): string {
    const filterKey = filters ? `:${filters}` : ''
    return `${this.CACHE_PREFIX}${instanceId}${filterKey}`
  }

  static get(instanceId: string, filters?: string) {
    return globalCache.get(this.getCacheKey(instanceId, filters))
  }

  static set(instanceId: string, contacts: any[], filters?: string): void {
    globalCache.set(this.getCacheKey(instanceId, filters), contacts, this.TTL)
  }

  static delete(instanceId: string, filters?: string): boolean {
    return globalCache.delete(this.getCacheKey(instanceId, filters))
  }

  static clearInstance(instanceId: string): void {
    // Clear all cached contact lists for an instance
    const keys = Array.from((globalCache as any).cache.keys()) as string[]
    keys.forEach(key => {
      if (key.startsWith(`${this.CACHE_PREFIX}${instanceId}`)) {
        globalCache.delete(key)
      }
    })
  }
}

// Cleanup interval - run every 5 minutes
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    const cleaned = globalCache.cleanup()
    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`)
    }
  }, 5 * 60 * 1000)
}

export { globalCache }
export default globalCache