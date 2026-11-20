import ImageUploader from './ImageUploader'

interface Props {
  images: string[]
  onChange: (images: string[]) => void
}

export default function ProductImagesField({ images, onChange }: Props) {
  const imageSlots = images.length > 0 ? images : ['']

  function updateImage(index: number, image: string) {
    if (images.length === 0) {
      if (image) onChange([image])
      return
    }

    onChange(image
      ? images.map((current, currentIndex) => currentIndex === index ? image : current)
      : images.filter((_, currentIndex) => currentIndex !== index))
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="block text-xs font-semibold text-[#111111]">Product Images</div>
        <p className="mt-1 text-[11px] text-gray-500">Click or drag to upload images. Images are optional.</p>
      </div>
      {imageSlots.map((image, index) => (
        <div key={`${index}-${image}`} className="rounded-xl border border-gray-200 p-3">
          <ImageUploader
            value={image}
            onChange={(value) => updateImage(index, value)}
            label={`Image ${index + 1}`}
            required={false}
            allowRemove={false}
          />
          {image && (
            <button
              type="button"
              onClick={() => updateImage(index, '')}
              className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Remove image
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...images, ''])}
        className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-[#FF6A00] hover:text-[#FF6A00]"
      >
        + Add another image
      </button>
    </div>
  )
}
