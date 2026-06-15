// Profile/image handling WITHOUT Firebase Storage (which needs the paid plan).
// Images are downscaled + compressed in the browser to a small base64 data URL
// that's saved inline with the resume doc in Firestore.

export const MAX_IMAGE_BYTES = 2_000_000 // 2 MB source file cap
export const MAX_IMAGE_LABEL = '2 MB'
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg']
export const ACCEPT_ATTR = '.png,.jpg,.jpeg'

// Validate a source image file. Returns an error message, or null if OK.
export function validateImage(file: File): string | null {
  const okType =
    ACCEPTED_IMAGE_TYPES.includes(file.type) || /\.(png|jpe?g)$/i.test(file.name)
  if (!okType) return 'Only PNG, JPG, or JPEG images are allowed.'
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / 1_000_000).toFixed(1)
    return `Image too large (${mb} MB). Only images up to ${MAX_IMAGE_LABEL} are allowed.`
  }
  return null
}

// Downscale to fit within maxDim and JPEG-compress until under maxBytes.
// Returns a base64 data URL safe to store inline in Firestore.
export async function compressImage(
  file: File,
  maxDim = 512,
  maxBytes = 500_000,
): Promise<string> {
  const dataUrl = await readAsDataURL(file)
  const img = await loadImage(dataUrl)

  let { width, height } = img
  if (width > maxDim || height > maxDim) {
    const scale = Math.min(maxDim / width, maxDim / height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, width, height)

  // Step quality down until the encoded image fits the byte budget.
  let quality = 0.9
  let out = canvas.toDataURL('image/jpeg', quality)
  while (out.length * 0.75 > maxBytes && quality > 0.4) {
    quality -= 0.1
    out = canvas.toDataURL('image/jpeg', quality)
  }
  return out
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}
