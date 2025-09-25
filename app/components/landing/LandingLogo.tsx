import Link from "next/link"

export default function LandingLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 text-white hover:opacity-90">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/90 shadow-lg shadow-cyan-500/30">
        <span className="text-2xl font-bold">C</span>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-semibold tracking-wide">EXERZIA</span>
        <span className="text-xs text-white/70">Coaching Virtuel</span>
      </div>
    </Link>
  )
}
