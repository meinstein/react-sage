import * as React from 'react'

import { useFilePicker } from '.'

const previewFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result as string), false)
    if (file) {
      reader.readAsDataURL(file)
    }
  })
}

const MAX_FILE_SIZE = 1

export const UseFilePickerDemo: React.FC = () => {
  const [data, setData] = React.useState([])
  const { files, onClick, errors, HiddenFileInput } = useFilePicker({
    maxFileSize: MAX_FILE_SIZE,
    maxImageWidth: 1000,
    imageQuality: 0.92,
    resizeImage: true
  })

  React.useEffect(() => {
    const fetchDataURLs = async (): Promise<void> => {
      const data = await Promise.all(files.map(previewFile))
      setData(data)
    }
    fetchDataURLs()
  }, [files.map((f) => f.name).join()])

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
      <div>
        {data.map((d, i) => (
          <img src={d} key={i} />
        ))}
      </div>
    </>
  )
}
