// eslint-disable-next-line @typescript-eslint/no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Cache } from './queryCache'

const cache = new Cache()

const mockResourceOne = { userId: 1, id: 1, title: 'Foo', completed: true }
const keyOne = cache.createKey('RESOURCE', JSON.stringify({ id: mockResourceOne.id }))

const mockResourceTwo = { userId: 2, id: 2, title: 'Bar', completed: true }
const keyTwo = cache.createKey('RESOURCE', JSON.stringify({ id: mockResourceTwo.id }))

afterEach(() => cache.clear())

test('Upsert key with exact match', () => {
  cache.upsert(keyOne, mockResourceOne, 'DONE')
  const cachedResult = cache.retrieve(keyOne)
  expect(cachedResult.data).toEqual(mockResourceOne)
})

test('Remove key with exact match', () => {
  cache.upsert(keyOne, mockResourceOne, 'DONE')
  cache.deleteKeyWithExactMatch(keyOne)
  expect(cache.cache).toEqual(new Map())
})

test('Remove keys with partial match', () => {
  cache.upsert(keyOne, mockResourceOne, 'DONE')
  cache.upsert(keyTwo, mockResourceTwo, 'DONE')
  cache.deleteKeysWithPartialMatch('RESOURCE', 1)

  // resource one should now be deleted
  const cahcedResultOne = cache.retrieve(keyOne)
  expect(cahcedResultOne).toBeUndefined()
  // but resource two should still be there
  const cachedResultTwo = cache.retrieve(keyTwo)
  expect(cachedResultTwo.data).toEqual(mockResourceTwo)
})

test('Ignores TTL during offline mode', async () => {
  cache.configure({ mode: 'ONLINE' })
  cache.upsert(keyOne, mockResourceOne, 'DONE')
  // Allow some time to pass so that resource is "old"
  await new Promise((r) => setTimeout(r, 5))
  const cachedResultOne = cache.retrieve(keyOne, 0)
  expect(cachedResultOne).toBeUndefined()

  // Now set to offline mode
  cache.configure({ mode: 'OFFLINE' })
  cache.upsert(keyTwo, mockResourceTwo, 'DONE')
  await new Promise((r) => setTimeout(r, 5))
  const cachedResultTwo = cache.retrieve(keyTwo, 0)
  expect(cachedResultTwo.data).toEqual(mockResourceTwo)
})

test('Does not exceed the configured max size', () => {
  cache.configure({ maxSize: 1 })

  cache.upsert(keyOne, mockResourceOne, 'DONE')
  cache.upsert(keyTwo, mockResourceTwo, 'DONE')

  // The cache removes the oldest entry after max size is exceeded.
  // Therefore, keyOne should no longer be available.
  const cachedResult = cache.retrieve(keyOne)
  expect(cachedResult).toBeUndefined()
})

test('Persists to local storage', () => {
  cache.configure({ type: 'LOCAL_STORAGE' })

  cache.upsert(keyOne, mockResourceOne, 'DONE')
  const serializedMapEntries = window.localStorage._queryCache
  expect(JSON.parse(serializedMapEntries).length).toBe(1)
})

test('Persists to session storage', () => {
  cache.configure({ type: 'SESSION_STORAGE' })

  cache.upsert(keyOne, mockResourceOne, 'DONE')
  const serializedMapEntries = window.sessionStorage._queryCache
  expect(JSON.parse(serializedMapEntries).length).toBe(1)
})
