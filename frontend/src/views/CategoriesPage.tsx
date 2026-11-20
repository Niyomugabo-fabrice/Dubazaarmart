"use client"

import Image from 'next/image'
import Link from 'next/link'
import { categories } from '../data/products'
import { useCategoryImages } from '../store/categoryImagesStore'

export default function CategoriesPage() {
  const { categoryImages, error } = useCategoryImages()

  return (
    <div className="min-h-screen pt-6 pb-16" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="badge mb-2 pt-8" style={{ color: '#FF6A00' }}>BROWSE</div>
        <h1 className="text-4xl font-bold text-[#111111] mb-3">All Categories</h1>
        <p className="mb-10" style={{ color: '#111111' }}>Browse our full range of electronics sourced from Dubai</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const imageUrl = categoryImages[cat.id]
            return (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.id}`}
                className="card-hover flex flex-col items-center gap-4 p-6 rounded-2xl text-center"
                style={{ background: '#FFF7E8', border: '1px solid #FFB800' }}
              >
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-gray-200">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt=""
                      width={96}
                      height={96}
                      unoptimized
                      className="h-24 w-24 object-cover"
                    />
                  ) : null}
                </div>
                <div className="font-semibold text-[#111111] text-sm">{cat.name}</div>
              </Link>
            )
          })}
        </div>
        {error && (
          <p role="alert" className="mt-4 text-center text-xs text-[#0B5B24]">
            Category images are temporarily unavailable. Showing placeholders.
          </p>
        )}
      </div>
    </div>
  )
}
