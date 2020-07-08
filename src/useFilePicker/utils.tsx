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
export const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // create a new html image element
    const img = new Image()
    // set the image src attribute to our dataUrl
    img.src = dataUrl
    // listen for onload event
    img.addEventListener('load', () => resolve(img), false)
    img.addEventListener('error', (ev) => {
      reject(`Error loading image: ${ev}`)
    })
  })
}

export const areImageDimsValid = (image: HTMLImageElement, dims?: UseFileImageDims): boolean => {
  if (dims) {
    if (dims.minImageHeight && image.height < dims.minImageHeight) {
      return false
    }

    if (dims.minImageWidth && image.width < dims.minImageWidth) {
      return false
    }

    if (dims.maxImageHeight && image.height > dims.maxImageHeight) {
      return false
    }

    if (dims.maxImageWidth && image.width > dims.maxImageWidth) {
      return false
    }
  }

  return true
}

export const resizeImage = (img: HTMLImageElement, maxSize: number, mime: string, quality = 0.92): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    let { width, height } = img
    const maxDimension = Math.max(width, height)
    if (maxDimension > maxSize) {
      const scale = maxSize / maxDimension
      width = scale * img.width
      height = scale * img.height
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    const blobCallback = (blob: Blob | null): void => {
      if (blob) {
        resolve(blob)
      } else {
        reject('Could not resize. Blob not available.')
      }
    }
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height)
      ctx.canvas.toBlob(blobCallback, mime, quality)
    } else {
      reject('Could not reize. Canvas context not available.')
    }
  })
}
