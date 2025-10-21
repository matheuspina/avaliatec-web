/**
 * Tests for cache utility functions
 */

import { InstanceSettingsCache, QuickMessagesCache, ContactListCache, globalCache } from '../cache'

describe('Cache Utilities', () => {
  beforeEach(() => {
    globalCache.clear()
  })

  describe('InstanceSettingsCache', () => {
    it('should cache and retrieve instance settings', () => {
      const instanceId = 'test-instance-1'
      const settings = {
        reject_calls: true,
        auto_reply_enabled: false,
        availability_schedule: {}
      }

      // Set cache
      InstanceSettingsCache.set(instanceId, settings)

      // Get from cache
      const cached = InstanceSettingsCache.get(instanceId)
      expect(cached).toEqual(settings)
    })

    it('should return null for non-existent cache entries', () => {
      const cached = InstanceSettingsCache.get('non-existent')
      expect(cached).toBeNull()
    })

    it('should delete cache entries', () => {
      const instanceId = 'test-instance-2'
      const settings = { reject_calls: false }

      InstanceSettingsCache.set(instanceId, settings)
      expect(InstanceSettingsCache.get(instanceId)).toEqual(settings)

      InstanceSettingsCache.delete(instanceId)
      expect(InstanceSettingsCache.get(instanceId)).toBeNull()
    })
  })

  describe('ContactListCache', () => {
    it('should cache contact lists with filters', () => {
      const instanceId = 'test-instance-1'
      const contacts = [
        { id: '1', name: 'John', contact_type: 'cliente' },
        { id: '2', name: 'Jane', contact_type: 'lead' }
      ]
      const filters = 'type=cliente'

      ContactListCache.set(instanceId, contacts, filters)
      const cached = ContactListCache.get(instanceId, filters)
      
      expect(cached).toEqual(contacts)
    })

    it('should clear instance-specific cache', () => {
      const instanceId = 'test-instance-1'
      const contacts1 = [{ id: '1', name: 'John' }]
      const contacts2 = [{ id: '2', name: 'Jane' }]

      ContactListCache.set(instanceId, contacts1, 'filter1')
      ContactListCache.set(instanceId, contacts2, 'filter2')

      expect(ContactListCache.get(instanceId, 'filter1')).toEqual(contacts1)
      expect(ContactListCache.get(instanceId, 'filter2')).toEqual(contacts2)

      ContactListCache.clearInstance(instanceId)

      expect(ContactListCache.get(instanceId, 'filter1')).toBeNull()
      expect(ContactListCache.get(instanceId, 'filter2')).toBeNull()
    })
  })

  describe('QuickMessagesCache', () => {
    it('should cache quick messages', () => {
      const quickMessages = [
        { id: '1', shortcut: '/hello', message_text: 'Hello there!' },
        { id: '2', shortcut: '/thanks', message_text: 'Thank you!' }
      ]

      QuickMessagesCache.set(quickMessages)
      const cached = QuickMessagesCache.get()

      expect(cached).toEqual(quickMessages)
    })
  })

  describe('Global Cache', () => {
    it('should handle TTL expiration', async () => {
      const key = 'test-key'
      const data = { test: 'data' }
      const shortTTL = 100 // 100ms

      globalCache.set(key, data, shortTTL)
      expect(globalCache.get(key)).toEqual(data)

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(globalCache.get(key)).toBeNull()
    })

    it('should provide cache statistics', () => {
      globalCache.set('key1', 'data1', 10000) // Valid
      globalCache.set('key2', 'data2', 1) // Will expire quickly

      const stats = globalCache.getStats()
      expect(stats.total).toBe(2)
      expect(stats.valid).toBeGreaterThan(0)
    })

    it('should cleanup expired entries', async () => {
      globalCache.set('key1', 'data1', 50) // Short TTL
      globalCache.set('key2', 'data2', 10000) // Long TTL

      expect(globalCache.size()).toBe(2)

      // Wait for first key to expire
      await new Promise(resolve => setTimeout(resolve, 100))

      const cleaned = globalCache.cleanup()
      expect(cleaned).toBe(1)
      expect(globalCache.size()).toBe(1)
    })
  })
})