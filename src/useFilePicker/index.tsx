import * as React from 'react'

import { UseFileOptions, UseFileResponse, UseFileErrors } from './types'
import { loadFile, loadImage, areImageDimsValid, resizeImage as resizeImageUtil } from './utils'

export * from './types'

const BYTES_PER_METABYTE = 1000000

export const useFilePicker = ({
  minFileSize,
  maxFileSize,
  minImageWidth,
  maxImageWidth,
  minImageHeight,
  maxImageHeight,
  resizeImage,
  imageQuality
}: UseFileOptions): UseFileResponse => {
  const fileInputRef = React.useRef(undefined)
  const [files, setFileList] = React.useState<File[] | null>([])
  const [errors, setError] = React.useState<UseFileErrors>({})

  const onChange = async (fileList: FileList): Promise<void> => {
    if (!fileList || !fileList.length) return

    // Scrub previous errors
    setError(() => ({}))

    // Convert native file list to iterable. Much easier to work with.
    let iterableFileList = Array.from(fileList) as File[]

    if (minFileSize) {
      // convert minSize from megabytes to bytes
      const minBytes = minFileSize * BYTES_PER_METABYTE
      const tooSmall = iterableFileList.some((file) => file.size < minBytes)
      setError((prevErrors) => ({ ...prevErrors, hasInvalidFileSize: tooSmall }))
    }

    if (maxFileSize) {
      // convert maxSize from megabytes to bytes
      const maxBytes = maxFileSize * BYTES_PER_METABYTE
      const tooBig = iterableFileList.some((file) => file.size > maxBytes)
      setError((prevErrors) => ({ ...prevErrors, hasInvalidFileSize: tooBig }))
    }

    const dims = { minImageWidth, maxImageWidth, minImageHeight, maxImageHeight }
    // Is there at least one dim to care about?
    if (Object.values(dims).some(Boolean)) {
      try {
        const dataUrls = await Promise.all(iterableFileList.map(loadFile))
        const images = await Promise.all(dataUrls.map(loadImage))
        const hasImageWithInvalidDims = images.some((image) => !areImageDimsValid(image, dims))
        // Is there an image in the collection with invalid dims or...
        // ...does user want to change the quality of the images?
        if ((hasImageWithInvalidDims && resizeImage) || (!hasImageWithInvalidDims && imageQuality)) {
          const resizedImageBlobs = await Promise.all(
            images.map((image, index) => {
              // Either we resize based on a max width/height provided by the user...
              // Or we use the image itself and just change the quality (without scaling size).
              const maxSize = Math.max(maxImageWidth || 0, maxImageHeight || 0) || Math.max(image.width, image.height)
              const imageType = iterableFileList[index].type
              return resizeImageUtil(image, maxSize, imageType, imageQuality)
            })
          )
          iterableFileList = resizedImageBlobs.map((blob, index) => {
            const fileName = iterableFileList[index].name
            return new File([blob], fileName, { lastModified: Date.now() })
          })
          setError((prevErrors) => ({ ...prevErrors, hasInvalidImage: false }))
        } else if (hasImageWithInvalidDims) {
          setError((prevErrors) => ({ ...prevErrors, hasInvalidImage: true }))
        } else {
          setError((prevErrors) => ({ ...prevErrors, hasInvalidImage: false }))
        }
      } catch (err) {
        setError((prevErrors) => ({ ...prevErrors, hasInvalidImage: true }))
      }
    }

    setFileList(iterableFileList)
  }

  return {
    files,
    errors,
    onClick(): void {
      fileInputRef?.current?.click()
    },
    HiddenFileInput({ multiple, accept }): React.ReactElement {
      return (
        <input
          type="file"
          ref={fileInputRef}
          multiple={multiple}
          accept={accept}
          style={{ display: 'none' }}
          onChange={(evt): void => {
            const target = evt.target as HTMLInputElement
            onChange(target.files)
          }}
        />
      )
    }
  }
}
