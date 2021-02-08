import { renderHook, act } from '@testing-library/react-hooks'

import { sleep } from './utils'
import { useBatchQuery } from './useBatchQuery'

test('fetches data on mount', async () => {
  /**
   * Ceremony
   */
  const method = jest.fn(
    async (params: { id: number }): Promise<{ id: number; name: string }> => {
      await sleep(5)
      return Promise.resolve({ ...params, name: 'foo' })
    }
  )

  const { result: r, waitForNextUpdate } = renderHook(() =>
    useBatchQuery(method, {
      args: [{ id: 1 }],
      wait: false
    })
  )

  /**
   * Should have no result and enter loading state as soon as hook renders/mounts.
   */
  expect(r.current.loading).toBeTruthy()
  expect(r.current.result).toBeNull()

  /**
   * Wait for hook to update (ie, allow network request to resolve).
   */
  await waitForNextUpdate()

  expect(r.current.loading).toBeFalsy()
  expect(r.current.result).toEqual([{ id: 1, name: 'foo' }])
})

test('waits on fetching until ready', async () => {
  /**
   * Ceremony
   */
  const method = jest.fn(
    async (params: { id: number }): Promise<{ id: number; name: string }> => {
      await sleep(5)
      return Promise.resolve({ ...params, name: 'foo' })
    }
  )
  let wait = true

  const { result: r, rerender, waitForNextUpdate } = renderHook(() =>
    useBatchQuery(method, { args: [{ id: 1 }], wait })
  )

  // Should not load and not have called method on mount.
  expect(r.current.loading).toBeFalsy()
  expect(r.current.error).toBeNull()
  expect(method).toHaveBeenCalledTimes(0)

  // Stop waiting at this point and re-render
  wait = false
  rerender()

  // Allow fetch timer to reolsve
  await waitForNextUpdate()

  // Should now return fetched data
  expect(r.current.result).toEqual([{ id: 1, name: 'foo' }])
  expect(method).toHaveBeenCalledTimes(1)
})

test('starts polling when configured to do so', async () => {
  jest.useFakeTimers()
  const method = jest.fn()

  let delay = 1000

  const { rerender } = renderHook(() => useBatchQuery(method, { args: [{ name: 'foo' }], polling: { delay } }))

  /**
   * Fetches immediately upon mount.
   */
  expect(method).toHaveBeenCalledTimes(1)

  await act(async () => {
    jest.advanceTimersByTime(3000)
  })

  /**
   * Fetched three more times b/c delay is 1s and we advanced timer by 3s
   */
  expect(method).toHaveBeenCalledTimes(4)

  /**
   * Removing the delay and re-rendering the hook should clear the timer.
   */
  await act(async () => {
    delay = null
    rerender()
    jest.advanceTimersByTime(3000)
  })

  /**
   * Should still be 4 invocations even though an additional 3s have elapsed.
   */
  expect(method).toHaveBeenCalledTimes(4)

  /**
   * Re-introduce the delay and re-render.
   */
  await act(async () => {
    delay = 1000
    rerender()
    jest.advanceTimersByTime(3000)
  })

  /**
   * Now, the method should have been called 7 times in total.
   */
  expect(method).toHaveBeenCalledTimes(7)
  jest.clearAllMocks()
})
