"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchCategoryImages } from "../lib/categoryImagesApi"

export type CategoryImageMap = Record<string, string | null>

export function useCategoryImages() {
  const [categoryImages, setCategoryImages] = useState<CategoryImageMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const images = await fetchCategoryImages()
      setCategoryImages(Object.fromEntries(images.map(({ categoryId, imageUrl }) => [categoryId, imageUrl])))
      setError(null)
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Category images could not be loaded."
      setError(message)
      console.error("Category images could not be loaded.", loadError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updateCategoryImage = useCallback((categoryId: string, imageUrl: string) => {
    setCategoryImages((current) => ({ ...current, [categoryId]: imageUrl }))
  }, [])

  return { categoryImages, loading, error, refresh, updateCategoryImage }
}
