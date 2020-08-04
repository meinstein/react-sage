import { Cache } from './queryCache'

const mockResourceOne = { userId: 101, id: 101, title: 'Foo Bar', completed: true }
const mockResourceTwo = { userId: 102, id: 102, title: 'Foo Baz', completed: true }

const cache = new Cache()

afterEach(() => cache.reset())

test('Upsert key with exact match', () => {
  const key = cache.createKey('RETRIEVE_MOCK_RESOURCE', JSON.stringify({ id: 101 }))
  cache.upsert(key, mockResourceOne, 'DONE')
  const cachedResult = cache.retrieve(key)
  expect(cachedResult.data).toEqual(mockResourceOne)
})

test('Remove key with exact match', () => {
  const key = cache.createKey('RETRIEVE_MOCK_RESOURCE', JSON.stringify({ id: 101 }))
  cache.upsert(key, mockResourceOne, 'DONE')
  cache.deleteKeyWithExactMatch(key)
  expect(cache.cache).toEqual({})
})

test('Remove keys with partial match', () => {
  const keyOne = cache.createKey('RETRIEVE_MOCK_RESOURCE', JSON.stringify({ id: 101 }))
  cache.upsert(keyOne, mockResourceOne, 'DONE')
  const keyTwo = cache.createKey('RETRIEVE_MOCK_RESOURCE', JSON.stringify({ id: 102 }))
  cache.upsert(keyTwo, mockResourceTwo, 'DONE')
  cache.deleteKeysWithPartialMatch('RETRIEVE_MOCK_RESOURCE', 101)
  const cachedResult = cache.retrieve(keyTwo)
  expect(cachedResult.data).toEqual(mockResourceTwo)
})
