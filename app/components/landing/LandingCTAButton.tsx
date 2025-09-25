import Link from "next/link"

export default function LandingCTAButton() {
  return (
    <Link
      href="/login"
      prefetch={false}
      className="inline-flex min-w-[10rem] items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition hover:-translate-y-0.5 hover:bg-cyan-400"
    >
      Démarrer
    </Link>
  )
}
