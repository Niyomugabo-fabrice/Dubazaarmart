import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { apiFetch, apiUrl, mediaUrl } from '../services/api-client'

interface Props {
  value: string
  onChange: (url: string) => void
  label?: string
  required?: boolean
  allowRemove?: boolean
}

export default function ImageUploader({
  value,
  onChange,
  label = 'Product Image',
  required = true,
  allowRemove = true,
}: Props) {
  const [mode, setMode] = useState<'upload' | 'link' | 'preset'>('upload')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const PRESET_IMAGES = [
    { label: 'Smartphone', url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop&auto=format' },
    { label: 'Laptop', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop&auto=format' },
    { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&auto=format' },
    { label: 'Smartwatch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&auto=format' },
    { label: 'Gaming', url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&h=600&fit=crop&auto=format' },
    { label: 'Power Bank', url: 'https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?w=600&h=600&fit=crop&auto=format' },
  ]

  // Compress image on client if large so upload and page rendering is lightning fast
  function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const rawData = e.target?.result as string
        const img = new Image()
        img.onload = () => {
          const MAX_DIM = 1200
          let width = img.width
          let height = img.height

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width)
              width = MAX_DIM
            } else {
              width = Math.round((width * MAX_DIM) / height)
              height = MAX_DIM
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(rawData)
            return
          }
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL('image/jpeg', 0.88)
          resolve(compressed)
        }
        img.onerror = () => resolve(rawData)
        img.src = rawData
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleFile(file: File) {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      setUploadError('Please select a valid image file (PNG, JPG, JPEG, WEBP, or GIF).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image files must be 10MB or smaller.')
      return
    }

    try {
      setUploading(true)
      setUploadError(null)

      const compressedDataUrl = await compressImage(file)
      const compressedBlob = await (await fetch(compressedDataUrl)).blob()
      if (compressedBlob.size > 10 * 1024 * 1024) {
        throw new Error('The processed image is larger than 10MB.')
      }

      const formData = new FormData()
      formData.append('file', compressedBlob, file.name)
      const response = await apiFetch(apiUrl('/api/upload'), {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const result = await response.json() as { error?: unknown; message?: unknown }
        const message = typeof result.error === 'string'
          ? result.error
          : typeof result.message === 'string'
            ? result.message
            : 'Image upload failed.'
        throw new Error(message)
      }

      const result = await response.json() as { url?: unknown }
      if (typeof result.url !== 'string' || !result.url) {
        throw new Error('The image upload response did not include a URL.')
      }
      onChange(result.url)
    } catch (err) {
      console.error('Failed to process image:', err)
      setUploadError(err instanceof Error ? err.message : 'Could not process this image. Please try another file.')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#111111]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md font-bold transition-all ${
              mode === 'upload'
                ? 'bg-[#FF6A00] text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            📤 Upload File
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={() => setMode('link')}
            className={`px-2 py-0.5 rounded-md font-bold transition-all ${
              mode === 'link'
                ? 'bg-[#FF6A00] text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            🔗 Web Link
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={() => setMode('preset')}
            className={`px-2 py-0.5 rounded-md font-bold transition-all ${
              mode === 'preset'
                ? 'bg-[#FF6A00] text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            ✨ Presets
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
          {uploadError}
        </div>
      )}

      {/* Main Upload Dropzone Mode */}
      {mode === 'upload' && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            className="hidden"
          />

          {value ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-[#FFB800] bg-[#FFFDF5]">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#FFB800] bg-white flex-shrink-0 shadow-sm">
                <img
                  src={mediaUrl(value)}
                  alt="Product preview"
                  width={80}
                  height={80}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B5B24]">
                  <span>✓</span> Image uploaded & ready
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  This photo will appear in your store catalog and product details.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#FF6A00] text-black hover:bg-[#FF8533] transition-colors shadow-sm"
                  >
                    {uploading ? 'Processing…' : '📁 Change Image'}
                  </button>
                  {allowRemove && (
                    <button
                      type="button"
                      onClick={() => onChange('')}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                isDragging
                  ? 'border-[#FF6A00] bg-[#FFF7E8]'
                  : 'border-[#FFB800] bg-[#FFFDF5] hover:bg-[#FFF7E8]/70 hover:border-[#FF6A00]'
              }`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6A00]/15 text-2xl text-[#FF6A00] mb-2">
                {uploading ? '⏳' : '📷'}
              </div>
              <div className="text-sm font-bold text-[#111111]">
                {uploading ? 'Uploading image from device…' : 'Click or drag to upload images'}
              </div>
              <p className="mt-1 text-xs text-[#0B5B24]">
                PNG, JPG, JPEG, WEBP, GIF from your phone, tablet, or computer (Max 10MB)
              </p>
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#FF6A00] text-black shadow-sm"
              >
                <span>📁</span> Browse Files
              </button>
            </div>
          )}
        </div>
      )}

      {/* Web Link Mode */}
      {mode === 'link' && (
        <div className="space-y-2">
          <input
            type="url"
            placeholder="https://images.unsplash.com/photo-..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm"
            style={{ background: '#FFF7E8', border: '1px solid #FFB800', color: '#111111' }}
          />
          {value && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FFF7E8]">
              <img src={mediaUrl(value)} alt="Preview" width={48} height={48} loading="lazy" decoding="async" className="w-12 h-12 rounded object-cover border" />
              <span className="text-xs text-gray-600 truncate">Image link loaded</span>
            </div>
          )}
        </div>
      )}

      {/* Preset Pick Mode */}
      {mode === 'preset' && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PRESET_IMAGES.map((p) => (
              <button
                type="button"
                key={p.label}
                onClick={() => onChange(p.url)}
                className={`p-1.5 rounded-xl border text-center transition-all ${
                  value === p.url
                    ? 'border-[#FF6A00] bg-[#FFF7E8] ring-2 ring-[#FF6A00]'
                    : 'border-gray-200 bg-white hover:border-[#FFB800]'
                }`}
              >
                <img
                  src={p.url}
                  alt={p.label}
                  width={160}
                  height={48}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-12 object-cover rounded-lg mb-1"
                />
                <span className="text-[10px] font-bold text-gray-800 block truncate">
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
