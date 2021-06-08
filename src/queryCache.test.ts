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
  cache.upsert({ key: keyOne, data: mockResourceOne, error: null, status: 'DONE' })
  const result = cache.retrieve({ key: keyOne })
  expect(result.data).toEqual(mockResourceOne)
})

test('Remove key with exact match', () => {
  cache.upsert({ key: keyOne, data: mockResourceOne, error: null, status: 'DONE' })
  cache.deleteKeyWithExactMatch(keyOne)
  expect(cache.cache).toEqual(new Map())
})

test('Remove keys with partial match', () => {
  cache.upsert({ key: keyOne, data: mockResourceOne, error: null, status: 'DONE' })
  cache.upsert({ key: keyTwo, data: mockResourceTwo, error: null, status: 'DONE' })
  cache.deleteKeysWithPartialMatch('RESOURCE', 1)

  // resource one should now be deleted
  const resultOne = cache.retrieve({ key: keyOne })
  // but resource two should still be there
  const resultTwo = cache.retrieve({ key: keyTwo })

  expect(resultOne).toBeUndefined()
  expect(resultTwo.data).toEqual(mockResourceTwo)
})

test('Ignores TTL during offline mode', async () => {
  // Insert some stuff while online
  cache.configure({ mode: 'ONLINE', maxAge: 1 })
  cache.upsert({ key: keyOne, data: mockResourceOne, error: null, status: 'DONE' })
  // Flip to offline (nothing new can be set during offline mode)
  cache.configure({ mode: 'OFFLINE' })
  // sleep for longer than the maxAge (1s)
  await sleep(1001)
  // Resource should still be available
  const resultOne = cache.retrieve({ key: keyOne })
  expect(resultOne.data).toEqual(mockResourceOne)
  // Flip back to online mode
  cache.configure({ mode: 'ONLINE' })
  // This time resource should be undefined bc it is stale
  const resultOneAgain = cache.retrieve({ key: keyOne })
  expect(resultOneAgain).toBeUndefined()
})

test('Stops inserting after offline mode toggled on', async () => {
  // Insert some stuff while online
  cache.configure({ mode: 'ONLINE' })
  cache.upsert({ key: keyOne, data: mockResourceOne, error: null, status: 'DONE' })
  // Flip to offline (nothing new can be set during offline mode)
  cache.configure({ mode: 'OFFLINE' })
  cache.upsert({ key: keyTwo, data: mockResourceTwo, error: null, status: 'FAILED' })
  const resultOne = cache.retrieve({ key: keyOne })
  expect(resultOne.data).toEqual(mockResourceOne)
  const resultTwo = cache.retrieve({ key: keyTwo })
  expect(resultTwo).toBeUndefined()
})

test('Does not exceed the configured max size', () => {
  cache.configure({ maxSize: 1 })

  cache.upsert({ key: keyOne, data: mockResourceOne, error: null, status: 'DONE' })
  cache.upsert({ key: keyTwo, data: mockResourceTwo, error: null, status: 'DONE' })

  // The cache removes the oldest entry after max size is exceeded.
  // Therefore, keyOne should no longer be available.
  const result = cache.retrieve({ key: keyOne })
  expect(result).toBeUndefined()
})

test('Persists to local storage', () => {
  cache.configure({ type: 'LOCAL_STORAGE' })

  cache.upsert({ key: keyOne, data: mockResourceOne, error: null, status: 'DONE' })
  const serializedMapEntries = window.localStorage._queryCache
  expect(JSON.parse(serializedMapEntries).length).toBe(1)
})

test('Persists to session storage', () => {
  cache.configure({ type: 'SESSION_STORAGE' })

  cache.upsert({ key: keyOne, data: mockResourceOne, error: null, status: 'DONE' })
  const serializedMapEntries = window.sessionStorage._queryCache
  expect(JSON.parse(serializedMapEntries).length).toBe(1)
})

test('Other expired keys are removed during retrieval', async () => {
  // maxAge of 1 second
  cache.configure({ maxAge: 1 })
  // Add a resource
  cache.upsert({ key: keyOne, data: mockResourceOne, error: null, status: 'DONE' })
  // Sleep for just over one second
  await sleep(1001)
  // Add a second resource
  cache.upsert({ key: keyTwo, data: mockResourceTwo, error: null, status: 'DONE' })
  // Retrieve second resource
  cache.retrieve({ key: keyTwo })
  // keyOne should now be expired and cleared, bc every retrieval flushes expired items.
  expect([...cache._queryCache.entries()].length).toBe(1)
})
