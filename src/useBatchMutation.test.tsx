import { renderHook, act } from '@testing-library/react-hooks'

import { sleep } from './utils'
import { useBatchMutation } from './useBatchMutation'

const mockedApiClientMethod = jest.fn(
  async (params: { name: string }): Promise<{ id: number; name: string }> => {
    await sleep(5)
    if (['foo', 'bar'].includes(params.name)) {
      return Promise.resolve({ ...params, id: 1 })
    } else {
      return Promise.reject('Boooo!')
    }
  }
)

test('useBatchMutation', async () => {
  /**
   * Ceremony.
   */
  const onSuccess = jest.fn()
  const onError = jest.fn()
  const { result: r, waitForNextUpdate } = renderHook(() => useBatchMutation(mockedApiClientMethod, onSuccess, onError))

  /**
   * Invoke the mutation for the first time.
   */
  await act(async () => {
    r.current.invoke([{ name: 'foo' }])
  })

  /**
   * The first post-invocation change ought to be the loading state.
   */
  expect(r.current.invocations.length).toBe(0)
  expect(r.current.result).toEqual({ error: null, loading: true, response: [] })

  /**
   * Wait for hook to update (ie, allow network request to resolve).
   */
  await waitForNextUpdate()

  /**
   * At this point, the hook has a result + an invocation history.
   */
  expect(mockedApiClientMethod.mock.calls.length).toBe(1)
  expect(onSuccess.mock.calls.length).toBe(1)
  expect(onError.mock.calls.length).toBe(0)
  expect(r.current.invocations.length).toBe(1)
  expect(r.current.result).toEqual({ error: null, loading: false, response: [{ name: 'foo', id: 1 }] })

  /**
   * Trigger the mutation a second time.
   */
  await act(async () => {
    r.current.invoke([{ name: 'bar' }])
  })

  /**
   * Trigger the mutation a second time should: a) reset response state and b) go into loading state
   */
  expect(r.current.result).toEqual({ error: null, loading: true, response: [] })

  /**
   * Wait for hook to update (ie, allow network request to resolve).
   */
  await waitForNextUpdate()

  /**
   * At this point, the hook has a new result + an invocation history with 2 entries.
   * Moreover, the onSuccess callback has been called yet again.
   */
  expect(onSuccess.mock.calls.length).toBe(2)
  expect(onError.mock.calls.length).toBe(0)
  expect(mockedApiClientMethod.mock.calls.length).toBe(2)
  expect(r.current.invocations.length).toBe(2)
  expect(r.current.result).toEqual({ error: null, loading: false, response: [{ name: 'bar', id: 1 }] })

  /**
   * Trigger the mutation a third time - but this time it will error out.
   */
  await act(async () => {
    r.current.invoke([{ name: 'error' }])
  })

  /**
   * Allow loading to resume.
   */
  expect(r.current.result).toEqual({ error: null, loading: true, response: [] })

  /**
   * Wait for hook to update (ie, allow network request to resolve).
   */
  await waitForNextUpdate()

  /**
   * At this point, the hook has an error result + empty response + an invocation history with 3 entries.
   * Moreover, the onError callback was called.
   */
  expect(onSuccess.mock.calls.length).toBe(2)
  expect(onError.mock.calls.length).toBe(1)
  expect(mockedApiClientMethod.mock.calls.length).toBe(3)
  expect(r.current.invocations.length).toBe(3)
  expect(r.current.result).toEqual({ error: 'Boooo!', loading: false, response: [] })

  /**
   * Let's reset the mutation.
   */
  await act(async () => {
    r.current.reset()
  })

  /**
   * At this point, everything in the hook's state should be wiped clean.
   */
  expect(onSuccess.mock.calls.length).toBe(2)
  expect(onError.mock.calls.length).toBe(1)
  expect(mockedApiClientMethod.mock.calls.length).toBe(3)
  expect(r.current.invocations.length).toBe(0)
  expect(r.current.result).toEqual({ error: null, loading: false, response: [] })
})
