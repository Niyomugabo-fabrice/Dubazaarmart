"use client"

import { useEffect, useMemo, useState } from "react"
import type { StockItemSummary } from "../lib/dashboardApi"

interface Props {
  products: StockItemSummary[]
  selectedProductId: string
  onSelect: (product: StockItemSummary | null) => void
  disabled?: boolean
}

function productLabel(product: StockItemSummary) {
  return `${product.name} / ${product.sku}`
}

export default function PurchaseOrderProductPicker({ products, selectedProductId, onSelect, disabled = false }: Props) {
  const selectedProduct = products.find((product) => product.id === selectedProductId)
  const selectedLabel = selectedProduct ? productLabel(selectedProduct) : ""
  const [query, setQuery] = useState(selectedLabel)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (selectedLabel) setQuery(selectedLabel)
  }, [selectedLabel])

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase()
    return products
      .filter((product) => !term || `${product.name} ${product.sku}`.toLowerCase().includes(term))
  }, [products, query])

  return (
    <div className="relative">
      <input
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        value={query}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          if (event.target.value !== selectedLabel) onSelect(null)
        }}
        placeholder="Search products by name or SKU"
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-normal disabled:bg-gray-100"
      />
      {open && !disabled && (
        <div role="listbox" className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
          {matches.length > 0 ? matches.map((product) => (
            <button
              key={product.id}
              type="button"
              role="option"
              aria-selected={product.id === selectedProductId}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onSelect(product)
                setQuery(productLabel(product))
                setOpen(false)
              }}
              className="block w-full rounded-md px-2.5 py-2 text-left hover:bg-[#FFF7E8]"
            >
              <span className="block text-xs font-semibold text-gray-900">{product.name}</span>
              <span className="mt-0.5 block font-mono text-[10px] text-gray-500">{product.sku}</span>
            </button>
          )) : (
            <div className="px-2.5 py-3 text-xs text-gray-500">No matching products</div>
          )}
        </div>
      )}
    </div>
  )
}
