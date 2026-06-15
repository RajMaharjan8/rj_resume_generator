import { useCallback, useState } from 'react'
import { compressImage, validateImage } from '../../lib/photo'

// Opens a file picker, validates + compresses, returns a base64 data URL.
export function useImageUpload() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = useCallback((onDone: (dataUrl: string) => void) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.png,.jpg,.jpeg'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const err = validateImage(file)
      if (err) {
        setError(err)
        return
      }
      setError(null)
      setBusy(true)
      try {
        const url = await compressImage(file, 1024, 700_000)
        onDone(url)
      } catch {
        setError('Could not process image.')
      } finally {
        setBusy(false)
      }
    }
    input.click()
  }, [])

  return { pick, busy, error }
}
