import { apiFetch, apiUrl, getStoredAdminSession } from "../services/api-client"

export interface CategoryImage {
  categoryId: string
  imageUrl: string | null
  updatedAt: string | null
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

export async function fetchCategoryImages(): Promise<CategoryImage[]> {
  const response = await apiFetch(apiUrl("/api/categories/images"))
  return readCategoryImages(response)
}

export async function fetchPublicCategoryImages(): Promise<CategoryImage[]> {
  const response = await fetch(apiUrl("/api/categories/images"), {
    next: { revalidate: 300, tags: ["category-images"] },
  })
  return readCategoryImages(response)
}

async function readCategoryImages(response: Response): Promise<CategoryImage[]> {
  if (!response.ok) return responseError(response, "Category images could not be loaded.")
  const body: unknown = await response.json()
  if (!body || typeof body !== "object" || !("images" in body) || !Array.isArray(body.images)) {
    throw new Error("The category images response was invalid.")
  }
  return body.images as CategoryImage[]
}

export async function uploadCategoryImage(
  categoryId: string,
  file: Blob,
  filename: string,
): Promise<CategoryImage> {
  const formData = new FormData()
  formData.append("file", file, filename)
  const response = await apiFetch(apiUrl(`/api/admin/categories/${encodeURIComponent(categoryId)}/image`), {
    method: "POST",
    headers: adminHeaders(),
    body: formData,
  })
  if (!response.ok) return responseError(response, "The category image could not be saved.")
  const body: unknown = await response.json()
  if (!body || typeof body !== "object" || !("image" in body)) {
    throw new Error("The saved category image response was invalid.")
  }
  return (body as { image: CategoryImage }).image
}
