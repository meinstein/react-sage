import { UseFileImageDims } from '../types'

export const loadImage = (dataUrl: string, dims: UseFileImageDims): Promise<void> => {
  return new Promise((resolve, reject) => {
    // create a new html image element
    const img = new Image()
    // set the image src attribute to our dataUrl
    img.src = dataUrl

    // listen for onload event
    img.addEventListener(
      'load',
      () => {
        if (
          img.width < dims.minImageHeight ||
          img.height < dims.minImageHeight ||
          img.width > dims.maxImageWidth ||
          img.height > dims.maxImageWidth
        ) {
          reject()
        }

        resolve()
      },
      false
    )

    img.addEventListener('error', (ev) => {
      reject(`Error loading image: ${ev}`)
    })
  })
}
