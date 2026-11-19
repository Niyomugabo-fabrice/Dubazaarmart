"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { apiFetch, apiUrl } from "../services/api-client"
import {
  createTestimonial,
  updateTestimonial,
  type Testimonial,
} from "../lib/testimonialsApi"

interface Props {
  isOpen: boolean
  testimonial: Testimonial | null
  onClose: () => void
  onSaved: (testimonial: Testimonial, isUpdate: boolean) => void
}

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export default function TestimonialFormModal({ isOpen, testimonial, onClose, onSaved }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [customerName, setCustomerName] = useState("")
  const [role, setRole] = useState("")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [message, setMessage] = useState("")
  const [isVisible, setIsVisible] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setCustomerName(testimonial?.customerName ?? "")
    setRole(testimonial?.role ?? "")
    setPhotoUrl(testimonial?.photoUrl ?? null)
    setRating(testimonial?.rating ?? 5)
    setMessage(testimonial?.message ?? "")
    setIsVisible(testimonial?.isVisible ?? true)
    setUploadingPhoto(false)
    setSaving(false)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [isOpen, testimonial])

  if (!isOpen) return null

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError("Choose a JPEG, PNG, WebP, or GIF image.")
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Choose an image smaller than 10 MB.")
      return
    }

    setUploadingPhoto(true)
    setError(null)
    try {
      const compressedPhoto = await compressPhoto(file)
      const formData = new FormData()
      formData.append("file", compressedPhoto, "testimonial-photo.jpg")
      formData.append("folder", "testimonials")
      const response = await apiFetch(apiUrl("/api/upload"), { method: "POST", body: formData })
      if (!response.ok) {
        let errorMessage = "The photo could not be uploaded."
        try {
          const body: unknown = await response.json()
          if (body && typeof body === "object" && "message" in body) {
            const responseMessage = (body as { message?: unknown }).message
            if (typeof responseMessage === "string") errorMessage = responseMessage
            if (Array.isArray(responseMessage)) errorMessage = responseMessage.join(" ")
          }
        } catch {
          throw new Error(errorMessage)
        }
        throw new Error(errorMessage)
      }
      const body: unknown = await response.json()
      if (!body || typeof body !== "object" || !("url" in body) || typeof body.url !== "string") {
        throw new Error("The photo upload response was invalid.")
      }
      setPhotoUrl(body.url)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The photo could not be uploaded.")
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const input = {
        customerName: customerName.trim(),
        role: role.trim() || null,
        photoUrl,
        rating,
        message: message.trim(),
        isVisible,
      }
      const saved = testimonial
        ? await updateTestimonial(testimonial.id, input)
        : await createTestimonial(input)
      onSaved(saved, testimonial !== null)
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The testimonial could not be saved.")
    } finally {
      setSaving(false)
    }
  }

  const busy = saving || uploadingPhoto

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="testimonial-modal-title"
    >
      <div
        className="max-h-[calc(100dvh_-_2rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-3xl p-5 shadow-2xl sm:p-7"
        style={{ background: "#FFFFFF", border: "1px solid #FFB800" }}
      >
        <div className="mb-5 flex items-center justify-between border-b pb-4" style={{ borderColor: "#F1FFF0" }}>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#FF6A00]">Customer feedback</div>
            <h2 id="testimonial-modal-title" className="mt-1 text-xl font-bold text-[#111111]">
              {testimonial ? "Edit Testimonial" : "Add Testimonial"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close testimonial form"
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold text-black/60 hover:bg-black/5 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold text-[#0B5B24]">
              Customer name
              <input
                required
                maxLength={120}
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#FFB800] px-3.5 py-2.5 text-sm font-normal text-[#111111]"
              />
            </label>
            <label className="block text-xs font-bold text-[#0B5B24]">
              Role / location <span className="font-normal">(optional)</span>
              <input
                maxLength={120}
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#FFB800] px-3.5 py-2.5 text-sm font-normal text-[#111111]"
              />
            </label>
          </div>

          <div>
            <div className="mb-2 text-xs font-bold text-[#0B5B24]">Photo <span className="font-normal">(optional, max 300x300)</span></div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#FFB800] bg-[#FFF7E8] text-xl font-bold text-[#FF6A00]">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={`${customerName || "Customer"} portrait`}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  customerName.trim().slice(0, 1).toUpperCase() || "?"
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="rounded-xl border border-[#FFB800] px-3.5 py-2 text-xs font-bold text-[#0B5B24] hover:bg-[#FFF7E8] disabled:opacity-50"
              >
                {uploadingPhoto ? "Compressing and uploading…" : photoUrl ? "Change photo" : "Upload photo"}
              </button>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  disabled={busy}
                  className="rounded-xl px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Remove photo
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhotoChange}
                className="sr-only"
              />
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-bold text-[#0B5B24]">Rating</legend>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  onClick={() => setRating(value)}
                  className={`rounded-lg px-1.5 py-1 text-2xl leading-none ${value <= rating ? "text-[#FF6A00]" : "text-slate-300"}`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-xs text-[#0B5B24]">{rating} of 5</span>
            </div>
          </fieldset>

          <label className="block text-xs font-bold text-[#0B5B24]">
            Message
            <textarea
              required
              maxLength={3000}
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-1.5 w-full resize-y rounded-xl border border-[#FFB800] px-3.5 py-2.5 text-sm font-normal text-[#111111]"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-[#111111]">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(event) => setIsVisible(event.target.checked)}
            />
            Visible on website
          </label>

          <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: "#F1FFF0" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn-gold rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm disabled:opacity-50"
            >
              {saving ? "Saving…" : testimonial ? "Save Changes" : "Add Testimonial"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

async function compressPhoto(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new window.Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error("The selected file could not be read as an image."))
      image.src = objectUrl
    })

    const scale = Math.min(300 / image.naturalWidth, 300 / image.naturalHeight, 1)
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("The photo could not be compressed in this browser.")
    context.drawImage(image, 0, 0, width, height)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("The photo could not be compressed.")),
        "image/jpeg",
        0.82,
      )
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
