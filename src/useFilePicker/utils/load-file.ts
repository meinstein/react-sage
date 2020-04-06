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
