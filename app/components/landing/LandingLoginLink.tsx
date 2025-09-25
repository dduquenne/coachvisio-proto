import Link from "next/link"

export default function LandingLoginLink() {
  return (
    <Link
      href="/login"
      className="text-sm font-semibold text-white transition hover:text-cyan-200"
      prefetch={false}
    >
      Se connecter
    </Link>
  )
}
