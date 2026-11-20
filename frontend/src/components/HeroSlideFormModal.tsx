"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { saveAdminHeroSlide, type HeroSlide, type HeroSlideInput } from "../lib/heroSlidesApi"

const MAX_HERO_IMAGE_SIZE = 3 * 1024 * 1024
const HERO_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

interface Props {
  isOpen: boolean
  slide: HeroSlide | null
  onClose: () => void
  onSaved: (slide: HeroSlide, isUpdate: boolean) => void
}

export default function HeroSlideFormModal({ isOpen, slide, onClose, onSaved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [heading, setHeading] = useState("")
  const [subheading, setSubheading] = useState("")
  const [buttonText, setButtonText] = useState("")
  const [buttonLink, setButtonLink] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [image, setImage] = useState<HeroSlideInput["image"]>()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setHeading("")
      setSubheading("")
      setButtonText("")
      setButtonLink("")
      setIsActive(true)
      setImage(undefined)
      setPreviewUrl(null)
      setError(null)
      return
    }

    setHeading(slide?.heading ?? "")
    setSubheading(slide?.subheading ?? "")
    setButtonText(slide?.buttonText ?? "")
    setButtonLink(slide?.buttonLink ?? "")
    setIsActive(slide?.isActive ?? true)
    setImage(undefined)
    setPreviewUrl(slide?.imageUrl ?? null)
    setError(null)
  }, [isOpen, slide])

  useEffect(() => {
    if (!previewUrl?.startsWith("blob:")) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!HERO_IMAGE_TYPES.has(file.type)) {
      setError("Choose a JPG, PNG, or WEBP image.")
      return
    }
    if (file.size > MAX_HERO_IMAGE_SIZE) {
      setError("The selected image must be 3 MB or smaller.")
      return
    }

    setError(null)
    setCompressing(true)
    try {
      const optimized = await compressHeroImage(file)
      setImage(optimized)
      setPreviewUrl(URL.createObjectURL(optimized.blob))
    } catch (compressionError) {
      setError(compressionError instanceof Error ? compressionError.message : "The image could not be optimized.")
    } finally {
      setCompressing(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!slide && !image) {
      setError("Choose an image for this hero slide before saving.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const saved = await saveAdminHeroSlide(slide?.id ?? null, {
        heading: heading.trim(),
        subheading: subheading.trim(),
        buttonText: buttonText.trim(),
        buttonLink: buttonLink.trim(),
        isActive,
        image,
      })
      onSaved(saved, Boolean(slide))
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The hero slide could not be saved.")
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const busy = compressing || saving

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-slide-form-title"
    >
      <div className="max-h-[calc(100dvh_-_2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-[#FFB800] bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-[#F1FFF0] pb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#FF6A00]">Storefront content</p>
            <h2 id="hero-slide-form-title" className="mt-1 text-xl font-bold text-[#111111]">
              {slide ? "Edit Hero Slide" : "Add Hero Slide"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close hero slide form"
            className="rounded-full px-2 text-xl font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="hero-slide-image" className="mb-1.5 block text-xs font-semibold text-[#111111]">
              Slide image {!slide && <span className="text-red-600">*</span>}
            </label>
            <input
              ref={fileInputRef}
              id="hero-slide-image"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(event) => void handleFileChange(event)}
              className="sr-only"
            />
            {previewUrl ? (
              <div className="space-y-3">
                <div className="relative aspect-[16/7] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <Image src={previewUrl} alt="Hero slide preview" fill unoptimized className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  className="rounded-lg border border-[#FFB800] px-3 py-2 text-xs font-semibold text-[#0B5B24] hover:bg-[#FFF7E8] disabled:opacity-50"
                >
                  {image ? "Choose a different image" : "Replace image"}
                </button>
                <p className="text-[11px] text-slate-500">
                  Preview shown before saving. Maximum width 1920px; WebP when supported; maximum 3 MB.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="flex aspect-[16/7] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-600 hover:border-[#FF6A00] hover:bg-[#FFF7E8] disabled:opacity-50"
              >
                {compressing ? "Optimizing image…" : "Click to choose a hero image"}
                <span className="mt-1 text-xs font-normal text-slate-500">JPG, PNG, or WEBP · maximum 3 MB</span>
              </button>
            )}
          </div>

          <div>
            <label htmlFor="hero-slide-heading" className="mb-1 block text-xs font-semibold text-[#111111]">Heading (optional)</label>
            <input
              id="hero-slide-heading"
              value={heading}
              onChange={(event) => setHeading(event.target.value)}
              maxLength={160}
              placeholder="Enter a hero heading"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm placeholder:text-slate-400 placeholder:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="hero-slide-subheading" className="mb-1 block text-xs font-semibold text-[#111111]">Subheading (optional)</label>
            <textarea
              id="hero-slide-subheading"
              value={subheading}
              onChange={(event) => setSubheading(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Add a short supporting message"
              className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm placeholder:text-slate-400 placeholder:opacity-50"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="hero-slide-button-text" className="mb-1 block text-xs font-semibold text-[#111111]">Button text (optional)</label>
              <input
                id="hero-slide-button-text"
                value={buttonText}
                onChange={(event) => setButtonText(event.target.value)}
                maxLength={60}
                placeholder="e.g. Shop now"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm placeholder:text-slate-400 placeholder:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="hero-slide-button-link" className="mb-1 block text-xs font-semibold text-[#111111]">Button link (optional)</label>
              <input
                id="hero-slide-button-link"
                value={buttonLink}
                onChange={(event) => setButtonLink(event.target.value)}
                maxLength={2048}
                placeholder="/shop or https://example.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm placeholder:text-slate-400 placeholder:opacity-50"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-[#111111]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 accent-[#FF6A00]"
            />
            Active on the website
          </label>

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-[#F1FFF0] pt-4">
            <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-gold rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-50">
              {saving ? "Saving…" : slide ? "Save Changes" : "Add Slide"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

async function compressHeroImage(file: File): Promise<{ blob: Blob; filename: string }> {
  const sourceUrl = URL.createObjectURL(file)
  try {
    const image = new window.Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error("The selected file could not be read as an image."))
      image.src = sourceUrl
    })
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("The selected image has invalid dimensions.")
    }

    const scale = Math.min(1920 / image.naturalWidth, 1)
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("The image could not be optimized in this browser.")
    context.drawImage(image, 0, 0, width, height)

    for (const mimeType of ["image/webp", "image/jpeg"]) {
      for (const quality of [0.9, 0.78, 0.65, 0.52, 0.4, 0.3]) {
        const blob = await canvasToBlob(canvas, mimeType, quality)
        if (blob?.type === mimeType && blob.size <= MAX_HERO_IMAGE_SIZE) {
          const extension = mimeType === "image/webp" ? "webp" : "jpg"
          return { blob, filename: `hero-slide.${extension}` }
        }
      }
    }
    throw new Error("The optimized image could not be reduced below 3 MB.")
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality)
  })
}
