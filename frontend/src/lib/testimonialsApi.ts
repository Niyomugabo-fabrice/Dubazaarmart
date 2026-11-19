import { apiFetch, apiUrl, getStoredAdminSession } from "../services/api-client"

export interface Testimonial {
  id: string
  customerName: string
  role: string | null
  photoUrl: string | null
  rating: number
  message: string
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export interface TestimonialInput {
  customerName: string
  role: string | null
  photoUrl: string | null
  rating: number
  message: string
  isVisible: boolean
}

function adminHeaders(): Record<string, string> {
  const token = getStoredAdminSession().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function responseError(response: Response, fallback: string): Promise<never> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new Error(fallback)
  }
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message
    if (typeof message === "string" && message.trim()) throw new Error(message)
    if (Array.isArray(message)) {
      const readableMessage = message.filter((item): item is string => typeof item === "string").join(" ")
      if (readableMessage) throw new Error(readableMessage)
    }
  }
  throw new Error(fallback)
}

async function readTestimonials(response: Response, fallback: string): Promise<Testimonial[]> {
  if (!response.ok) return responseError(response, fallback)
  const body: unknown = await response.json()
  if (!body || typeof body !== "object" || !("testimonials" in body) || !Array.isArray(body.testimonials)) {
    throw new Error("The testimonials response was invalid.")
  }
  return body.testimonials as Testimonial[]
}

export async function fetchPublicTestimonials(): Promise<Testimonial[]> {
  const response = await apiFetch(apiUrl("/api/testimonials"))
  return readTestimonials(response, "Customer testimonials could not be loaded.")
}

export async function fetchAdminTestimonials(): Promise<Testimonial[]> {
  const response = await apiFetch(apiUrl("/api/admin/testimonials"), { headers: adminHeaders() })
  return readTestimonials(response, "Testimonials could not be loaded.")
}

export async function createTestimonial(input: TestimonialInput): Promise<Testimonial> {
  const response = await apiFetch(apiUrl("/api/admin/testimonials"), {
    method: "POST",
    headers: { ...adminHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  return readSavedTestimonial(response, "The testimonial could not be created.")
}

export async function updateTestimonial(
  id: string,
  input: Partial<TestimonialInput>,
): Promise<Testimonial> {
  const response = await apiFetch(apiUrl(`/api/admin/testimonials/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { ...adminHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  return readSavedTestimonial(response, "The testimonial could not be updated.")
}

export async function deleteTestimonial(id: string): Promise<void> {
  const response = await apiFetch(apiUrl(`/api/admin/testimonials/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers: adminHeaders(),
  })
  if (!response.ok) await responseError(response, "The testimonial could not be deleted.")
}

async function readSavedTestimonial(response: Response, fallback: string): Promise<Testimonial> {
  if (!response.ok) return responseError(response, fallback)
  const body: unknown = await response.json()
  if (!body || typeof body !== "object" || !("testimonial" in body)) {
    throw new Error("The saved testimonial response was invalid.")
  }
  return (body as { testimonial: Testimonial }).testimonial
}
