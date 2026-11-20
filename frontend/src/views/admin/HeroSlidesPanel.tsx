"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import ConfirmModal from "../../components/ConfirmModal"
import HeroSlideFormModal from "../../components/HeroSlideFormModal"
import { useToast } from "../../components/ui/Toast"
import {
  deleteAdminHeroSlide,
  fetchAdminHeroSlides,
  reorderAdminHeroSlides,
  updateAdminHeroSlideStatus,
  type HeroSlide,
} from "../../lib/heroSlidesApi"

export default function HeroSlidesPanel({ canManage }: { canManage: boolean }) {
  const toast = useToast()
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [slideToEdit, setSlideToEdit] = useState<HeroSlide | null>(null)
  const [slideToDelete, setSlideToDelete] = useState<HeroSlide | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  const loadSlides = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSlides(await fetchAdminHeroSlides())
    } catch (loadError) {
      console.error("Hero slides could not be loaded.", loadError)
      setError(loadError instanceof Error ? loadError.message : "Hero slides could not be loaded.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSlides()
  }, [loadSlides])

  function openCreateForm() {
    setSlideToEdit(null)
    setIsFormOpen(true)
  }

  function openEditForm(slide: HeroSlide) {
    setSlideToEdit(slide)
    setIsFormOpen(true)
  }

  function handleSaved(saved: HeroSlide, isUpdate: boolean) {
    setSlides((current) => {
      const next = isUpdate
        ? current.map((slide) => slide.id === saved.id ? saved : slide)
        : [...current, saved]
      return next.sort((left, right) => left.sortOrder - right.sortOrder)
    })
    toast.success(isUpdate ? "Hero slide updated." : "Hero slide added.")
    setIsFormOpen(false)
    setSlideToEdit(null)
  }

  async function handleToggle(slide: HeroSlide) {
    setTogglingId(slide.id)
    setError(null)
    try {
      const saved = await updateAdminHeroSlideStatus(slide.id, !slide.isActive)
      setSlides((current) => current.map((item) => item.id === saved.id ? saved : item))
      toast.success(saved.isActive ? "Hero slide activated." : "Hero slide deactivated.")
    } catch (toggleError) {
      const message = toggleError instanceof Error ? toggleError.message : "The hero slide status could not be changed."
      setError(message)
      toast.error(message)
    } finally {
      setTogglingId(null)
    }
  }

  async function moveSlide(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (reordering || targetIndex < 0 || targetIndex >= slides.length) return

    const previous = slides
    const next = [...slides]
    const moving = next[index]
    next[index] = next[targetIndex]
    next[targetIndex] = moving
    setSlides(next)
    setReordering(true)
    setError(null)
    try {
      setSlides(await reorderAdminHeroSlides(next.map((slide) => slide.id)))
    } catch (reorderError) {
      const message = reorderError instanceof Error ? reorderError.message : "The hero slide order could not be saved."
      setSlides(previous)
      setError(message)
      toast.error(message)
    } finally {
      setReordering(false)
    }
  }

  async function handleDelete() {
    if (!slideToDelete) return
    await deleteAdminHeroSlide(slideToDelete.id)
    setSlides((current) => current.filter((slide) => slide.id !== slideToDelete.id))
    toast.success("Hero slide deleted.")
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="badge mb-1" style={{ color: "#FF6A00" }}>STOREFRONT CONTENT</div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111]">Hero Section</h1>
          <p className="mt-1 text-sm text-[#0B5B24]">
            Manage the homepage banner slides, their text, visibility, and display order.
          </p>
        </div>
        {canManage && (
          <button type="button" onClick={openCreateForm} className="btn-gold rounded-xl px-4 py-2.5 text-sm font-bold">
            + Add Hero Slide
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <span>{error}</span>
          <button type="button" onClick={() => void loadSlides()} className="font-bold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading hero slides…</p>
      ) : slides.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-[#111111]">No hero slides yet</p>
          <p className="mt-1 text-sm text-slate-600">The storefront will use its default banner until you add a slide.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <article
              key={slide.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <Image
                  src={slide.imageUrl}
                  alt={slide.heading || `Hero slide ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">Slide {index + 1}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    slide.isActive ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"
                  }`}>
                    {slide.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <h2 className="truncate font-bold text-[#111111]">{slide.heading || "Image-only slide"}</h2>
                {(slide.subheading || slide.buttonText) && (
                  <p className="mt-0.5 truncate text-xs text-slate-600">
                    {slide.subheading || `Button: ${slide.buttonText}`}
                  </p>
                )}
              </div>
              <div className="ml-auto flex max-w-full flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={slide.isActive}
                    disabled={!canManage || togglingId === slide.id}
                    onChange={() => void handleToggle(slide)}
                    className="h-4 w-4 accent-[#FF6A00]"
                  />
                  {togglingId === slide.id ? "Updating…" : slide.isActive ? "Active" : "Inactive"}
                </label>
                {canManage && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void moveSlide(index, -1)}
                      disabled={reordering || index === 0}
                      aria-label={`Move slide ${index + 1} up`}
                      title="Move up"
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => void moveSlide(index, 1)}
                      disabled={reordering || index === slides.length - 1}
                      aria-label={`Move slide ${index + 1} down`}
                      title="Move down"
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditForm(slide)}
                      className="rounded-lg border border-[#FFB800] px-3 py-1.5 text-xs font-bold text-[#0B5B24] hover:bg-[#FFF7E8]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideToDelete(slide)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <HeroSlideFormModal
        isOpen={isFormOpen}
        slide={slideToEdit}
        onClose={() => {
          setIsFormOpen(false)
          setSlideToEdit(null)
        }}
        onSaved={handleSaved}
      />
      <ConfirmModal
        isOpen={slideToDelete !== null}
        title="Delete Hero Slide"
        message={`Delete "${slideToDelete?.heading || "this hero slide"}"? This cannot be undone.`}
        confirmLabel="Delete Slide"
        danger
        onConfirm={handleDelete}
        onClose={() => setSlideToDelete(null)}
      />
    </div>
  )
}
