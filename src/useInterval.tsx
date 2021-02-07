/**
 * ALL CREDIT FOR THIS IMPLEMENTATION GOES TO:
 * https://usehooks-typescript.com/react-hook/use-interval
 */
import * as React from 'react'

export const useInterval = (callback: () => void, delay: number | null): void => {
  const savedCallback = React.useRef<() => void | null>()

  // Remember the latest callback.
  React.useEffect(() => {
    savedCallback.current = callback
  })

  // Set up the interval.
  React.useEffect(() => {
    function tick(): void {
      if (typeof savedCallback?.current !== 'undefined') {
        savedCallback?.current()
      }
    }

    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}
