import logo from "../assets/site-logo.png"

interface SiteLogoProps {
  className?: string
  showName?: boolean
}

export default function SiteLogo({
  className = "h-11 w-11",
  showName = true,
}: SiteLogoProps) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span
        className={`${className} flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-0.5 shadow-[0_6px_24px_rgba(8,116,249,0.2)]`}
      >
        <img
          src={logo}
          alt="Dubazaarmart logo"
          className="h-full w-full object-contain"
        />
      </span>
      {showName && (
        <span className="truncate text-lg font-extrabold tracking-tight text-[#111111]">
          Dubazaar<span className="logo-gradient-text">mart</span>
        </span>
      )}
    </span>
  )
}
