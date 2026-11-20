import { apiFetch, apiUrl, getStoredAdminSession } from "../services/api-client"

export interface HeroSlide {
  id: string
  imageUrl: string
  heading: string | null
  subheading: string | null
  buttonText: string | null
  buttonLink: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface HeroSlideInput {
  heading: string
  subheading: string
  buttonText: string
  buttonLink: string
  isActive: boolean
  image?: { blob: Blob; filename: string }
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

function readSlides(value: unknown): HeroSlide[] {
  if (!value || typeof value !== "object" || !("slides" in value) || !Array.isArray(value.slides)) {
    throw new Error("The hero slides response was invalid.")
  }
  if (!value.slides.every(isHeroSlide)) {
    throw new Error("The hero slides response contained an invalid slide.")
  }
  return value.slides
}

async function readSlide(response: Response): Promise<HeroSlide> {
  const body: unknown = await response.json()
  if (!body || typeof body !== "object" || !("slide" in body) || !isHeroSlide(body.slide)) {
    throw new Error("The saved hero slide response was invalid.")
  }
  return body.slide
}

function isHeroSlide(value: unknown): value is HeroSlide {
  if (!value || typeof value !== "object") return false
  const slide = value as Record<string, unknown>
  return typeof slide.id === "string" &&
    typeof slide.imageUrl === "string" &&
    (typeof slide.heading === "string" || slide.heading === null) &&
    (typeof slide.subheading === "string" || slide.subheading === null) &&
    (typeof slide.buttonText === "string" || slide.buttonText === null) &&
    (typeof slide.buttonLink === "string" || slide.buttonLink === null) &&
    typeof slide.sortOrder === "number" &&
    typeof slide.isActive === "boolean" &&
    typeof slide.createdAt === "string" &&
    typeof slide.updatedAt === "string"
}

export async function fetchActiveHeroSlides(): Promise<HeroSlide[]> {
  const response = await apiFetch(apiUrl("/api/hero-slides/active"))
  if (!response.ok) return responseError(response, "Hero slides could not be loaded.")
  return readSlides(await response.json())
}

export async function fetchAdminHeroSlides(): Promise<HeroSlide[]> {
  const response = await apiFetch(apiUrl("/api/admin/hero-slides"), { headers: adminHeaders() })
  if (!response.ok) return responseError(response, "Hero slides could not be loaded.")
  return readSlides(await response.json())
}

export async function saveAdminHeroSlide(id: string | null, input: HeroSlideInput): Promise<HeroSlide> {
  const body = new FormData()
  body.append("heading", input.heading)
  body.append("subheading", input.subheading)
  body.append("buttonText", input.buttonText)
  body.append("buttonLink", input.buttonLink)
  body.append("isActive", String(input.isActive))
  if (input.image) body.append("file", input.image.blob, input.image.filename)

  const response = await apiFetch(
    apiUrl(id ? `/api/admin/hero-slides/${encodeURIComponent(id)}` : "/api/admin/hero-slides"),
    {
      method: id ? "PATCH" : "POST",
      headers: adminHeaders(),
      body,
    },
  )
  if (!response.ok) return responseError(response, "The hero slide could not be saved.")
  return readSlide(response)
}

export async function reorderAdminHeroSlides(slideIds: string[]): Promise<HeroSlide[]> {
  const response = await apiFetch(apiUrl("/api/admin/hero-slides/reorder"), {
    method: "PATCH",
    headers: { ...adminHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ slideIds }),
  })
  if (!response.ok) return responseError(response, "The hero slide order could not be saved.")
  return readSlides(await response.json())
}

export async function updateAdminHeroSlideStatus(id: string, isActive: boolean): Promise<HeroSlide> {
  const response = await apiFetch(apiUrl(`/api/admin/hero-slides/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { ...adminHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  })
  if (!response.ok) return responseError(response, "The hero slide status could not be changed.")
  return readSlide(response)
}

export async function deleteAdminHeroSlide(id: string): Promise<void> {
  const response = await apiFetch(apiUrl(`/api/admin/hero-slides/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers: adminHeaders(),
  })
  if (!response.ok) return responseError(response, "The hero slide could not be deleted.")
}
