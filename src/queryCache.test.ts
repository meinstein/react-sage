// eslint-disable-next-line @typescript-eslint/no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Cache } from './queryCache'

const cache = new Cache()

const mockResourceOne = { userId: 1, id: 1, title: 'Foo', completed: true }
const keyOne = cache.createKey('RESOURCE', JSON.stringify({ id: mockResourceOne.id }))

const mockResourceTwo = { userId: 2, id: 2, title: 'Bar', completed: true }
const keyTwo = cache.createKey('RESOURCE', JSON.stringify({ id: mockResourceTwo.id }))

const sleepInSeconds = async (seconds: number): Promise<void> => {
  await new Promise((r) => setTimeout(r, seconds * 1000))
}

beforeEach(() => {
  cache.configure({
    maxAge: 30,
    staleWhileRevalidate: 60,
    maxSize: 10,
    mode: 'ONLINE',
    type: 'IN_MEMORY'
  })
})

afterEach(() => {
  cache.clear()
})

test('Upsert key with exact match', () => {
  cache.upsert({ key: keyOne, value: { data: mockResourceOne, error: null, status: 'DONE' } })
  const result = cache.retrieve({ key: keyOne })
  expect(result.data).toEqual(mockResourceOne)
})

test('Remove key with exact match', () => {
  cache.upsert({ key: keyOne, value: { data: mockResourceOne, error: null, status: 'DONE' } })
  cache.deleteKey(keyOne)
  expect(cache.cache).toEqual(new Map())
})

test('Remove keys with partial match', () => {
  cache.upsert({ key: keyOne, value: { data: mockResourceOne, error: null, status: 'DONE' } })
  cache.upsert({ key: keyTwo, value: { data: mockResourceTwo, error: null, status: 'DONE' } })
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
  cache.configure({ mode: 'ONLINE', maxAge: 0.1, staleWhileRevalidate: 0.2 })
  cache.upsert({ key: keyOne, value: { data: mockResourceOne, error: null, status: 'DONE' } })
  // Flip to offline (nothing new can be set during offline mode)
  cache.configure({ mode: 'OFFLINE' })
  // sleep for longer than the maxAge (1s)
  await sleepInSeconds(0.15)
  // Resource should still be available
  let resultOne = cache.retrieve({ key: keyOne })
  expect(resultOne.data).toEqual(mockResourceOne)
  // status is still DONE even though the max age has been exceeded.
  expect(resultOne.status).toEqual('DONE')
  // Flip back to online mode
  cache.configure({ mode: 'ONLINE' })
  // After going online, the resource should still be avialable bc has not exceeded SWR
  // Will be expired, though.
  resultOne = cache.retrieve({ key: keyOne })
  expect(resultOne.data).toEqual(mockResourceOne)
  expect(resultOne.status).toEqual('EXPIRED')
  // now sleep again and exceed the SWR
  await sleepInSeconds(0.1)
  resultOne = cache.retrieve({ key: keyOne })
  expect(resultOne).toBeUndefined()
})

test('Stops inserting after offline mode toggled on', async () => {
  // Insert some stuff while online
  cache.configure({ mode: 'ONLINE' })
  cache.upsert({ key: keyOne, value: { data: mockResourceOne, error: null, status: 'DONE' } })
  // Flip to offline (nothing new can be set during offline mode)
  cache.configure({ mode: 'OFFLINE' })
  cache.upsert({ key: keyTwo, value: { data: mockResourceTwo, error: null, status: 'FAILED' } })
  const resultOne = cache.retrieve({ key: keyOne })
  expect(resultOne.data).toEqual(mockResourceOne)
  const resultTwo = cache.retrieve({ key: keyTwo })
  expect(resultTwo).toBeUndefined()
})

test('Does not exceed the configured max size', () => {
  cache.configure({ maxSize: 1 })

  cache.upsert({ key: keyOne, value: { data: mockResourceOne, error: null, status: 'DONE' } })
  cache.upsert({ key: keyTwo, value: { data: mockResourceTwo, error: null, status: 'DONE' } })

  // The cache removes the oldest entry after max size is exceeded.
  // Therefore, keyOne should no longer be available.
  const result = cache.retrieve({ key: keyOne })
  expect(result).toBeUndefined()
})

test('Persists to local storage', () => {
  cache.configure({ type: 'LOCAL_STORAGE' })

  cache.upsert({ key: keyOne, value: { data: mockResourceOne, error: null, status: 'DONE' } })
  const serializedMapEntries = window.localStorage._queryCache
  expect(JSON.parse(serializedMapEntries).length).toBe(1)
})

test('Persists to session storage', () => {
  cache.configure({ type: 'SESSION_STORAGE' })

  cache.upsert({ key: keyOne, value: { data: mockResourceOne, error: null, status: 'DONE' } })
  const serializedMapEntries = window.sessionStorage._queryCache
  expect(JSON.parse(serializedMapEntries).length).toBe(1)
})

test('Other expired keys are removed during retrieval', async () => {
  cache.configure({ maxAge: 0.1, staleWhileRevalidate: 0.2 })
  // Add a resource
  cache.upsert({ key: keyOne, value: { data: mockResourceOne, error: null, status: 'DONE' } })

  await sleepInSeconds(0.15)

  // Retrieve the resource - should be expired at this point
  const result = cache.retrieve({ key: keyOne })
  // keyOne should now be expired and cleared, bc every retrieval flushes expired items.
  expect(result.status).toBe('EXPIRED')
})
