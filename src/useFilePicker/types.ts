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

// For more about these attributes, see: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file
interface FileInputProps {
  accept?: string
  multiple?: boolean
  capture?: 'user' | 'environment'
}

export interface UseFileResponse {
  files: FileList | null
  /**
   * A click handler to pass to any element that needs to trigger the
   * native file picker.
   */
  onClick: () => void
  /**
   * A dictionary of errors based on the FileInputProps passed in.
   */
  errors: UseFileErrors
  /**
   * A hidden file input element that must be rendered somewhere on the same page
   * as where the hook is used. This hidden file input is used to toggle open the
   * native file picker. However, it remains hidden otherwise in order to avoid the
   * native file picker input UI, which is generally undesirable and not easily
   * customizable. However, you may still pass any native file input props to this
   * hidden one in order to fine-tune your file picking needs.
   */
  HiddenFileInput(args: FileInputProps): React.ReactElement
}
