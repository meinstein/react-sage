import * as React from 'react'

import { useFilePicker } from '.'

export const UseFilePickerDemo: React.FC = () => {
  const { onClick, errors, HiddenFileInput } = useFilePicker({ maxFileSize: 0.1, maxImageWidth: 1081 })
  return (
    <div>
      <button onClick={onClick}>Click me to trigger hidden file input</button>
      <HiddenFileInput accept=".jpg, .jpeg, .png" multiple={false} />
      {errors.isFileSizeWrong && <b>File size is wrong!</b>}
      {errors.isImageSizeWrong && <b>Image dimensions are wrong!</b>}
    </div>
  )
}
