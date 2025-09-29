import { SESSION_COOKIE_NAME } from "@/app/lib/auth"
import LandingLogo from "@/app/components/landing/LandingLogo"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

const ERROR_MESSAGE = "Identifiant ou mot de passe invalide."

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE_NAME)
  if (session) {
    redirect("/")
  }

  const resolvedParams = (await searchParams) ?? {}
  const errorParam = resolvedParams.error
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#050b19] via-[#0b1832] to-[#040711]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(129,140,248,0.2),_transparent_55%)]" />

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12 md:px-10">
        <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-10 text-white shadow-[0_30px_90px_-40px_rgba(56,189,248,0.65)] backdrop-blur-xl">
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <LandingLogo />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Connexion</h1>
              <p className="text-sm text-slate-200/80">
                Utilisez les identifiants de démonstration <strong>Test/Test</strong> pour accéder à la simulation.
              </p>
            </div>
          </div>

          {error && (
            <p className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
              {ERROR_MESSAGE}
            </p>
          )}

          <form method="post" action="/api/login" className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="identifiant" className="text-sm font-medium text-slate-100">
                Identifiant
              </label>
              <input
                id="identifiant"
                name="identifiant"
                type="text"
                required
                autoComplete="username"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-base text-white shadow-inner shadow-white/5 placeholder:text-slate-200/50 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="motdepasse" className="text-sm font-medium text-slate-100">
                Mot de passe
              </label>
              <input
                id="motdepasse"
                name="motdepasse"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-base text-white shadow-inner shadow-white/5 placeholder:text-slate-200/50 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-cyan-500 px-5 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition hover:-translate-y-0.5 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/80"
            >
              Se connecter
            </button>
          </form>

          <p className="text-center text-xs text-slate-200/70">
            Besoin d’aide ? {" "}
            <Link href="mailto:support@example.com" className="font-medium text-cyan-200 transition hover:text-cyan-100">
              Contactez-nous
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
