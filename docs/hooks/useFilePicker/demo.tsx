import * as React from 'react'

import { useFilePicker } from '../../../src/useFilePicker'
import { loadFile } from '../../../src/useFilePicker/utils'

const MAX_FILE_SIZE = 1

export const UseFilePickerDemo: React.FC = () => {
  const [dataUrls, setDataUrls] = React.useState([])
  const { files, onClick, errors, HiddenFileInput } = useFilePicker({
    maxFileSize: MAX_FILE_SIZE,
    maxImageWidth: 1000,
    imageQuality: 0.92,
    resizeImage: true
  })

  React.useEffect(() => {
    const getDataUrls = async (): Promise<void> => {
      const data = await Promise.all(files.map(loadFile))
      setDataUrls(data)
    }
    getDataUrls()
  }, [files])

  return (
    <>
      <button onClick={onClick}>Click me to trigger hidden file input</button>
      <HiddenFileInput accept=".jpg, .jpeg, .png" multiple={false} />
      <pre>
        <b>Has invalid file size? </b>
        {errors.hasInvalidFileSize ? `Cannot be greater than ${MAX_FILE_SIZE}mb` : 'no'}
      </pre>
      <pre>
        <b>Has invalid image? </b>
        {errors.hasInvalidImage ? 'yes' : 'no'}
      </pre>
      <div style={{ maxWidth: 250 }}>
        {dataUrls.map((d, i) => (
          <img src={d} key={i} style={{ width: '100%' }} />
        ))}
      </div>
    </>
  )
}
