import { SUPABASE_URL } from './supabase.js'

async function compressImage(file, maxDim = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round(height * maxDim / width); width = maxDim }
        else { width = Math.round(width * maxDim / height); height = maxDim }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas not supported')); return }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1])
    }

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')) }
    img.src = url
  })
}

export async function parseTicketImage(imageFile, lotteryType = 'western_649') {
  const base64 = await compressImage(imageFile)

  const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mediaType: 'image/jpeg', lotteryType }),
  })

  if (!response.ok) {
    let msg = `Server error (${response.status})`
    try { const err = await response.json(); msg = err.error || err.message || msg } catch {}
    throw new Error(msg)
  }

  const data = await response.json()
  if (data.error) throw new Error(data.error)
  return { sets: data.sets || [], extra: data.extra || null, extra2: data.extra2 || null }
}
