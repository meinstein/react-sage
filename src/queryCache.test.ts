// eslint-disable-next-line @typescript-eslint/no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Cache } from './queryCache'

const cache = new Cache()

const mockResourceOne = { userId: 1, id: 1, title: 'Foo', completed: true }
const keyOne = cache.createKey('RESOURCE', JSON.stringify({ id: mockResourceOne.id }))

const mockResourceTwo = { userId: 2, id: 2, title: 'Bar', completed: true }
const keyTwo = cache.createKey('RESOURCE', JSON.stringify({ id: mockResourceTwo.id }))

const sleep = async (ms: number): Promise<void> => {
  await new Promise((r) => setTimeout(r, ms))
}

beforeEach(() => {
  cache.configure({
    maxAge: 60,
    maxSize: 10,
    mode: 'ONLINE',
    type: 'IN_MEMORY'
  })
})

afterEach(() => {
  cache.clear()
})

test('Upsert key with exact match', () => {
  cache.upsert({ key: keyOne, data: mockResourceOne, status: 'DONE' })
  const result = cache.retrieve({ key: keyOne })
  expect(result.data).toEqual(mockResourceOne)
})

test('Remove key with exact match', () => {
  cache.upsert({ key: keyOne, data: mockResourceOne, status: 'DONE' })
  cache.deleteKeyWithExactMatch(keyOne)
  expect(cache.cache).toEqual(new Map())
})

test('Remove keys with partial match', () => {
  cache.upsert({ key: keyOne, data: mockResourceOne, status: 'DONE' })
  cache.upsert({ key: keyTwo, data: mockResourceTwo, status: 'DONE' })
  cache.deleteKeysWithPartialMatch('RESOURCE', 1)

  // resource one should now be deleted
  const resultOne = cache.retrieve({ key: keyOne })
  // but resource two should still be there
  const resultTwo = cache.retrieve({ key: keyTwo })

  expect(resultOne).toBeUndefined()
  expect(resultTwo.data).toEqual(mockResourceTwo)
})

test('Ignores TTL during offline mode', async () => {
  cache.configure({ mode: 'ONLINE' })
  cache.upsert({ key: keyOne, data: mockResourceOne, status: 'DONE' })
  // Allow some time to pass so that resource is "old"
  await sleep(5)
  const resultOne = cache.retrieve({ key: keyOne, ttl: 0 })
  expect(resultOne).toBeUndefined()

  // Now set to offline mode
  cache.configure({ mode: 'OFFLINE' })
  cache.upsert({ key: keyTwo, data: mockResourceTwo, status: 'DONE' })
  await sleep(5)
  const resultTwo = cache.retrieve({ key: keyTwo, ttl: 0 })
  expect(resultTwo.data).toEqual(mockResourceTwo)
})

test('Does not exceed the configured max size', () => {
  cache.configure({ maxSize: 1 })

  cache.upsert({ key: keyOne, data: mockResourceOne, status: 'DONE' })
  cache.upsert({ key: keyTwo, data: mockResourceTwo, status: 'DONE' })

  // The cache removes the oldest entry after max size is exceeded.
  // Therefore, keyOne should no longer be available.
  const result = cache.retrieve({ key: keyOne })
  expect(result).toBeUndefined()
})

test('Persists to local storage', () => {
  cache.configure({ type: 'LOCAL_STORAGE' })

  cache.upsert({ key: keyOne, data: mockResourceOne, status: 'DONE' })
  const serializedMapEntries = window.localStorage._queryCache
  expect(JSON.parse(serializedMapEntries).length).toBe(1)
})

test('Persists to session storage', () => {
  cache.configure({ type: 'SESSION_STORAGE' })

  cache.upsert({ key: keyOne, data: mockResourceOne, status: 'DONE' })
  const serializedMapEntries = window.sessionStorage._queryCache
  expect(JSON.parse(serializedMapEntries).length).toBe(1)
})

test('Other expired keys are removed during retrieval', async () => {
  // maxAge of 1 second
  cache.configure({ maxAge: 1 })
  // Add a resource
  cache.upsert({ key: keyOne, data: mockResourceOne, status: 'DONE' })
  // Sleep for just over one second
  await sleep(1001)
  // Add a second resource
  cache.upsert({ key: keyTwo, data: mockResourceTwo, status: 'DONE' })
  // Retrieve second resource
  cache.retrieve({ key: keyTwo })
  // keyOne should now be expired and cleared, bc every retrieval flushes expired items.
  expect([...cache._queryCache.entries()].length).toBe(1)
})
