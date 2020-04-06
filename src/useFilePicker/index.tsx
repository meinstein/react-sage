import * as React from 'react'

import { UseFileOptions, UseFileResponse, UseFileErrors } from './types'
import { loadFile, loadImage } from './utils'

export * from './types'

export const useFilePicker = ({
  minFileSize,
  maxFileSize,
  minImageWidth,
  maxImageWidth,
  minImageHeight,
  maxImageHeight
}: UseFileOptions): UseFileResponse => {
  const [files, setFileList] = React.useState(null)
  const [errors, setError] = React.useState<UseFileErrors>({})
  const fileInputRef = React.useRef(undefined)

  const onChange = async (fileList: FileList): Promise<void> => {
    if (!fileList || !fileList.length) return

    // convert native file list to iterable
    const iterableFileList = Array.from(fileList) as File[]

    if (minFileSize) {
      // convert minSize from megabytes to bytes
      const minBytes = minFileSize * 1000000
      const tooSmall = iterableFileList.some((file) => file.size < minBytes)
      setError((prevErrors) => ({ ...prevErrors, isFileSizeWrong: tooSmall }))
    }

    if (maxFileSize) {
      // convert maxSize from megabytes to bytes
      const maxBytes = maxFileSize * 1000000
      const tooBig = iterableFileList.some((file) => file.size > maxBytes)
      setError((prevErrors) => ({ ...prevErrors, isFileSizeWrong: tooBig }))
    }

    if (minImageWidth || maxImageWidth || minImageHeight || maxImageHeight) {
      const dims = { minImageWidth, maxImageWidth, minImageHeight, maxImageHeight }
      try {
        const dataUrls = await Promise.all(iterableFileList.map(loadFile))
        await Promise.all(dataUrls.map((dataUrl) => loadImage(dataUrl, dims)))
        setError((prevErrors) => ({ ...prevErrors, isImageSizeWrong: false }))
      } catch (err) {
        setError((prevErrors) => ({ ...prevErrors, isImageSizeWrong: true }))
      }
    }

    setFileList(fileList)
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
