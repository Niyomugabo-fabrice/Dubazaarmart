"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import {
  deleteTestimonial,
  fetchAdminTestimonials,
  updateTestimonial,
  type Testimonial,
} from "../../lib/testimonialsApi"
import { useAdminAuth } from "../../store/adminAuthStore"
import { useToast } from "../../components/ui/Toast"

const TestimonialFormModal = dynamic(() => import("../../components/TestimonialFormModal"))
const ConfirmModal = dynamic(() => import("../../components/ConfirmModal"))

function previewMessage(message: string, maxLength = 100): string {
  const compact = message.replace(/\s+/g, " ").trim()
  return compact.length > maxLength ? `${compact.slice(0, maxLength).trimEnd()}…` : compact
}

export default function TestimonialsPanel() {
  const { admin } = useAdminAuth()
  const toast = useToast()
  const canManage = admin?.role === "MANAGER" || admin?.role === "STAFF"
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [testimonialToEdit, setTestimonialToEdit] = useState<Testimonial | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadTestimonials = useCallback(async () => {
    setLoading(true)
    try {
      const items = await fetchAdminTestimonials()
      setTestimonials(items)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Testimonials could not be loaded.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTestimonials()
  }, [loadTestimonials])

  function openCreate() {
    setTestimonialToEdit(null)
    setIsModalOpen(true)
  }

  function openEdit(testimonial: Testimonial) {
    setTestimonialToEdit(testimonial)
    setIsModalOpen(true)
  }

  async function handleToggle(testimonial: Testimonial) {
    if (!canManage || togglingId) return
    const nextState = !testimonial.isVisible
    setTogglingId(testimonial.id)
    setTestimonials((current) =>
      current.map((item) => item.id === testimonial.id ? { ...item, isVisible: nextState } : item),
    )
    try {
      const saved = await updateTestimonial(testimonial.id, { isVisible: nextState })
      setTestimonials((current) => current.map((item) => item.id === saved.id ? saved : item))
      toast.success(`Testimonial ${nextState ? "shown on" : "hidden from"} the website.`)
    } catch (toggleError) {
      setTestimonials((current) => current.map((item) => item.id === testimonial.id ? testimonial : item))
      toast.error(
        toggleError instanceof Error ? toggleError.message : "The visibility setting could not be changed.",
        "Update Failed",
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteTestimonial(deleteTarget.id)
      setTestimonials((current) => current.filter((item) => item.id !== deleteTarget.id))
      toast.success(`Testimonial from "${deleteTarget.customerName}" deleted.`)
      setDeleteTarget(null)
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "The testimonial could not be deleted.",
        "Delete Failed",
      )
      throw deleteError
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="badge mb-1" style={{ color: "#FF6A00" }}>CUSTOMER FEEDBACK</div>
          <h1 className="text-2xl font-bold text-[#111111]">Testimonials</h1>
          <p className="mt-1 text-xs text-[#0B5B24]">
            Manage customer stories shown on the storefront.
          </p>
        </div>
        {canManage && (
          <button type="button" onClick={openCreate} className="btn-gold rounded-xl px-4 py-2 text-xs font-bold shadow-sm">
            + Add Testimonial
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <span>{error}</span>
          <button type="button" onClick={() => void loadTestimonials()} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "#FFB800", background: "#FFFFFF" }}>
        <table className="w-full min-w-[850px] text-sm">
          <thead>
            <tr
              className="border-b text-left text-[11px] font-bold uppercase tracking-wider"
              style={{ background: "#FFF7E8", borderColor: "#FFB800", color: "#0B5B24" }}
            >
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Photo</th>
              <th className="py-3 px-4">Rating</th>
              <th className="py-3 px-4">Message</th>
              <th className="py-3 px-4">Visible</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-[#0B5B24]">Loading testimonials…</td>
              </tr>
            )}
            {!loading && testimonials.map((testimonial) => (
              <tr
                key={testimonial.id}
                className="border-t align-middle transition-colors hover:bg-[#FFF7E8]/40"
                style={{ borderColor: "rgba(255,184,0,0.25)" }}
              >
                <td className="py-3 px-4">
                  <div className="font-bold text-[#111111]">{testimonial.customerName}</div>
                  {testimonial.role && <div className="mt-0.5 text-[11px] text-[#0B5B24]">{testimonial.role}</div>}
                </td>
                <td className="py-3 px-4">
                  {testimonial.photoUrl ? (
                    <Image
                      src={testimonial.photoUrl}
                      alt={`${testimonial.customerName} portrait`}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 rounded-full border border-[#FFB800] object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF7E8] text-sm font-bold text-[#FF6A00]">
                      {testimonial.customerName.trim().slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap py-3 px-4 text-[#FF6A00]" aria-label={`${testimonial.rating} of 5 stars`}>
                  {"★".repeat(testimonial.rating)}<span className="text-slate-300">{"★".repeat(5 - testimonial.rating)}</span>
                </td>
                <td className="max-w-xs py-3 px-4 text-xs text-[#0B5B24]" title={testimonial.message}>
                  <span className="block truncate">{previewMessage(testimonial.message)}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {canManage ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={testimonial.isVisible}
                        aria-label={`Toggle ${testimonial.customerName} testimonial ${testimonial.isVisible ? "off" : "on"}`}
                        onClick={() => void handleToggle(testimonial)}
                        disabled={togglingId === testimonial.id}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                          testimonial.isVisible ? "bg-green-600" : "bg-slate-300"
                        } disabled:cursor-wait disabled:opacity-60`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            testimonial.isVisible ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    ) : (
                      <span className={`h-2.5 w-2.5 rounded-full ${testimonial.isVisible ? "bg-green-600" : "bg-slate-400"}`} />
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      testimonial.isVisible ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                    }`}>
                      {testimonial.isVisible ? "Yes" : "No"}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {canManage ? (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(testimonial)}
                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(testimonial)}
                        className="rounded-lg border border-[#FF6A00]/40 px-2.5 py-1 text-xs font-bold text-[#FF6A00] hover:bg-[#FF6A00]/10"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="text-right text-[11px] text-[#0B5B24]">View only</div>
                  )}
                </td>
              </tr>
            ))}
            {!loading && testimonials.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-[#0B5B24]">
                  No testimonials yet. {canManage ? "Add one to feature a customer story." : ""}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TestimonialFormModal
        isOpen={isModalOpen}
        testimonial={testimonialToEdit}
        onClose={() => {
          setIsModalOpen(false)
          setTestimonialToEdit(null)
        }}
        onSaved={(saved, isUpdate) => {
          setTestimonials((current) =>
            isUpdate ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current],
          )
          toast.success(
            isUpdate
              ? `Testimonial from "${saved.customerName}" updated.`
              : `Testimonial from "${saved.customerName}" added.`,
          )
        }}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Testimonial"
        message={
          deleteTarget
            ? `Delete the testimonial from "${deleteTarget.customerName}"? This will remove it from the website.`
            : "Delete this testimonial?"
        }
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
