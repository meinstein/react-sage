import * as React from 'react'

export interface UseFileImageDims {
  minImageWidth?: number
  maxImageWidth?: number
  minImageHeight?: number
  maxImageHeight?: number
}

export interface UseFileOptions extends UseFileImageDims {
  // Min file size in MB
  minFileSize?: number
  // Max file size in MB
  maxFileSize?: number
}

export interface UseFileErrors {
  isFileSizeWrong?: boolean
  isImageSizeWrong?: boolean
}

interface FileInputProps {
  accept?: string
  multiple?: boolean
  capture?: 'user' | 'environment'
}

export interface UseFileResponse {
  onClick: () => void
  errors: UseFileErrors
  files: FileList | null
  HiddenFileInput(args: FileInputProps): React.ReactElement
}
