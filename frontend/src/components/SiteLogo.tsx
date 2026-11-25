import Image from "next/image"

interface SiteLogoProps {
  className?: string
  showName?: boolean
  size?: number
  priority?: boolean
  variant?: "light" | "dark"
}

export default function SiteLogo({
  className = "h-11 w-11",
  showName = true,
  size = 44,
  priority = true,
  variant = "light",
}: SiteLogoProps) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span
        className={`${className} flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-0.5 shadow-sm border border-[#E2E8F0]`}
      >
        <Image
          src="/site-logo.png"
          alt="DubazaarMart logo"
          width={size}
          height={size}
          priority={priority}
          className="h-full w-full object-contain"
        />
      </span>
      {showName && (
        <span
          className={`truncate text-lg font-extrabold tracking-tight ${
            variant === "dark" ? "text-white" : "text-[#0A1F44]"
          }`}
        >
          Dubazaar<span className="text-[#FF6A00]">Mart</span>
        </span>
      )}
    </span>
  )
}
