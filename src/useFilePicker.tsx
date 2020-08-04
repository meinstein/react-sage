import * as React from 'react'

import { loadFile, loadImage, areImageDimsValid, resizeImage as resizeImageUtil } from './utils'

export namespace UseFilePicker {
  export interface ImageDims {
    minImageWidth?: number
    maxImageWidth?: number
    minImageHeight?: number
    maxImageHeight?: number
  }

  export interface Options extends ImageDims {
    // Min file size in MB
    minFileSize?: number
    // Max file size in MB
    maxFileSize?: number
    resizeImage?: boolean
    imageQuality?: number
  }

  export interface Errors {
    hasInvalidFileSize?: boolean
    hasInvalidImage?: boolean
  }

  // For more about these attributes, see: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file
  export interface FileInputProps {
    accept?: string
    multiple?: boolean
    capture?: 'user' | 'environment'
  }
}

const BYTES_PER_MEGABYTE = 1000000

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useFilePicker = (options: UseFilePicker.Options = {}) => {
  const {
    minFileSize,
    maxFileSize,
    minImageWidth,
    maxImageWidth,
    minImageHeight,
    maxImageHeight,
    resizeImage,
    imageQuality
  } = options
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [files, setFileList] = React.useState<File[] | null>([])
  const [errors, setError] = React.useState<UseFilePicker.Errors>({})

  const onChange = async (fileList: FileList | null): Promise<void> => {
    if (!fileList || !fileList.length) return

    // Scrub previous data from state
    setError(() => ({}))
    setFileList([])

    // Convert native file list to iterable. Much easier to work with.
    let iterableFileList = Array.from(fileList) as File[]

    if (minFileSize) {
      // convert minSize from megabytes to bytes
      const minBytes = minFileSize * BYTES_PER_MEGABYTE
      const tooSmall = iterableFileList.some((file) => file.size < minBytes)
      setError((prevErrors) => ({
        ...prevErrors,
        hasInvalidFileSize: tooSmall
      }))
    }

    if (maxFileSize) {
      // convert maxSize from megabytes to bytes
      const maxBytes = maxFileSize * BYTES_PER_MEGABYTE
      const tooBig = iterableFileList.some((file) => file.size > maxBytes)
      setError((prevErrors) => ({
        ...prevErrors,
        hasInvalidFileSize: tooBig
      }))
    }

    const dims = {
      minImageWidth,
      maxImageWidth,
      minImageHeight,
      maxImageHeight
    }
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
            return new File([blob], fileName, {
              lastModified: Date.now()
            })
          })
          setError((prevErrors) => ({
            ...prevErrors,
            hasInvalidImage: false
          }))
        } else if (hasImageWithInvalidDims) {
          setError((prevErrors) => ({
            ...prevErrors,
            hasInvalidImage: true
          }))
        } else {
          setError((prevErrors) => ({
            ...prevErrors,
            hasInvalidImage: false
          }))
        }
      } catch (err) {
        setError((prevErrors) => ({
          ...prevErrors,
          hasInvalidImage: true
        }))
      }
    }

    setFileList(iterableFileList)
    if (fileInputRef?.current) {
      fileInputRef.current.value = ''
    }
  }

  return {
    files,
    /**
     * A dictionary of errors based on the FileInputProps passed in.
     */
    errors,
    /**
     * A click handler to pass to any element that needs to trigger the
     * native file picker.
     */
    onClick(): void {
      if (fileInputRef?.current) {
        fileInputRef.current.click()
      }
    },
    /**
     * A hidden file input element that must be rendered somewhere on the same page
     * as where the hook is used. This hidden file input is used to toggle open the
     * native file picker. However, it remains hidden otherwise in order to avoid the
     * native file picker input UI, which is generally undesirable and not easily
     * customizable. However, you may still pass any native file input props to this
     * hidden one in order to fine-tune your file picking needs.
     */
    HiddenFileInput({ multiple, accept }: UseFilePicker.FileInputProps): React.ReactElement {
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
