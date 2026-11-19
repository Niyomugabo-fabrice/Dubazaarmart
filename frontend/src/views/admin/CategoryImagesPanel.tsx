"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { categoryImageIds, categories } from "../../data/products"
import { uploadCategoryImage, type CategoryImage } from "../../lib/categoryImagesApi"
import { useCategoryImages } from "../../store/categoryImagesStore"
import { useToast } from "../../components/ui/Toast"

const MAX_FILE_SIZE = 2 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"])

export default function CategoryImagesPanel() {
  const { categoryImages, loading, error, refresh, updateCategoryImage } = useCategoryImages()
  const toast = useToast()

  function handleSaved(image: CategoryImage) {
    if (!image.imageUrl) throw new Error("The uploaded category image did not include a URL.")
    updateCategoryImage(image.categoryId, image.imageUrl)
    const categoryName = categories.find((category) => category.id === image.categoryId)?.name ?? image.categoryId
    toast.success(`${categoryName} image updated.`)
  }

  return (
    <div>
      <div className="mb-6">
        <div className="badge mb-1" style={{ color: "#FF6A00" }}>STORE CATEGORIES</div>
        <h1 className="text-3xl font-bold tracking-tight text-[#111111]">Categories</h1>
        <p className="mt-1 text-sm text-[#0B5B24]">
          Upload or replace category images. Images are optimized to 400x400 pixels or smaller.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <p role="status" className="mb-4 text-sm text-[#0B5B24]">Loading category images…</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categoryImageIds.map((categoryId) => {
          const category = categories.find((item) => item.id === categoryId)
          return (
            <CategoryImageCard
              key={categoryId}
              categoryId={categoryId}
              categoryName={category?.name ?? categoryId}
              imageUrl={categoryImages[categoryId] ?? null}
              onSaved={handleSaved}
            />
          )
        })}
      </div>
    </div>
  )
}

function CategoryImageCard({
  categoryId,
  categoryName,
  imageUrl,
  onSaved,
}: {
  categoryId: string
  categoryName: string
  imageUrl: string | null
  onSaved: (image: CategoryImage) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [optimizedFile, setOptimizedFile] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [filename, setFilename] = useState("")
  const [compressing, setCompressing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (
      (file.type && !ACCEPTED_IMAGE_TYPES.has(file.type)) ||
      (!file.type && !ACCEPTED_EXTENSIONS.has(extension))
    ) {
      setError("Choose a JPG, PNG, or WEBP image.")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("The selected image must be 2 MB or smaller.")
      return
    }

    setError(null)
    setCompressing(true)
    try {
      const compressed = await compressCategoryImage(file)
      const nextPreviewUrl = URL.createObjectURL(compressed)
      setPreviewUrl(nextPreviewUrl)
      setOptimizedFile(compressed)
      setFilename(`${categoryId}.${compressed.type === "image/webp" ? "webp" : "jpg"}`)
    } catch (compressionError) {
      setError(compressionError instanceof Error ? compressionError.message : "The image could not be optimized.")
    } finally {
      setCompressing(false)
    }
  }

  async function handleSave() {
    if (!optimizedFile || saving) return
    setSaving(true)
    setError(null)
    try {
      const saved = await uploadCategoryImage(categoryId, optimizedFile, filename)
      onSaved(saved)
      setOptimizedFile(null)
      setPreviewUrl(null)
      setFilename("")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The category image could not be saved.")
    } finally {
      setSaving(false)
    }
  }

  function discardPreview() {
    setOptimizedFile(null)
    setPreviewUrl(null)
    setFilename("")
    setError(null)
  }

  const busy = compressing || saving
  const displayedImage = previewUrl ?? imageUrl

  return (
    <article className="rounded-2xl border p-5" style={{ borderColor: "#FFB800", background: "#FFFFFF" }}>
      <div className="flex items-start gap-4">
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-200">
          {displayedImage ? (
            <Image
              src={displayedImage}
              alt={`${categoryName} category`}
              width={96}
              height={96}
              unoptimized
              className="h-24 w-24 object-cover"
            />
          ) : (
            <span className="text-center text-[10px] font-medium text-gray-500">No image</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-[#111111]">{categoryName}</h2>
          <p className="mt-1 text-xs text-[#0B5B24]">
            {previewUrl ? "Preview — save to publish" : imageUrl ? "Current image" : "No image uploaded yet"}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="mt-3 rounded-lg border border-[#FFB800] px-3 py-2 text-xs font-bold text-[#0B5B24] hover:bg-[#FFF7E8] disabled:opacity-50"
          >
            {imageUrl ? "Choose replacement" : "Choose image"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">JPG, PNG, or WEBP · maximum 2 MB · optimized to 400x400</p>

      {compressing && <p role="status" className="mt-3 text-xs text-[#0B5B24]">Optimizing image…</p>}
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-800">{error}</p>
      )}

      {optimizedFile && (
        <div className="mt-4 flex justify-end gap-2 border-t pt-4" style={{ borderColor: "rgba(255,184,0,0.3)" }}>
          <button
            type="button"
            onClick={discardPreview}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Discard preview
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={busy}
            className="btn-gold rounded-lg px-4 py-2 text-xs font-bold shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save image"}
          </button>
        </div>
      )}
    </article>
  )
}

async function compressCategoryImage(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new window.Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error("The selected file could not be read as an image."))
      image.src = objectUrl
    })
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("The selected image has invalid dimensions.")
    }

    const scale = Math.min(400 / image.naturalWidth, 400 / image.naturalHeight, 1)
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("The image could not be optimized in this browser.")
    context.drawImage(image, 0, 0, width, height)

    for (const mimeType of ["image/webp", "image/jpeg"]) {
      for (const quality of [0.82, 0.65, 0.5]) {
        const blob = await canvasToBlob(canvas, mimeType, quality)
        if (blob?.type === mimeType && blob.size <= MAX_FILE_SIZE) return blob
      }
    }
    throw new Error("The optimized image could not be reduced below 2 MB.")
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality)
  })
}
