import { renderHook } from '@testing-library/react-hooks'

import { useQuery } from '.'
import { Resource } from './demo'

const mockResource = { userId: 101, id: 101, title: 'Foo Bar', completed: true }

const client = {
  async getResource(): Promise<Resource> {
    return Promise.resolve(mockResource)
  }
}

// NOTE FOR FUTURE TEST WRITING: https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning
test('Is null on initial render', () => {
  const { result } = renderHook(() => useQuery(client.getResource))
  expect(result.current.result).toEqual(null)
})
