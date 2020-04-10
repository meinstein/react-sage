import { UseFileImageDims } from './types'

/**
 * Wraps native File Reader API in a promise.
 */
export const loadFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener(
      'load',
      () => {
        // convert image file to base64 string
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        }
      },
      false
    )

    reader.addEventListener(
      'error',
      () => {
        reject(new Error('There was an error uploading the file'))
      },
      false
    )

    if (file) {
      reader.readAsDataURL(file)
    }
  })
}

/**
 * Wraps native image loader API in a promise.
 */
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
