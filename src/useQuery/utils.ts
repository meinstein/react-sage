/**
 * Promise-ified setTimeout for increased readability.
 */
export const sleep = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}
