import { SESSION_COOKIE_NAME } from "@/app/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

const ERROR_MESSAGE = "Identifiant ou mot de passe invalide."

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = cookies().get(SESSION_COOKIE_NAME)
  if (session) {
    redirect("/")
  }

  const resolvedParams = (await searchParams) ?? {}
  const errorParam = resolvedParams.error
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Connexion</h1>
          <p className="text-sm text-gray-500">
            Utilisez les identifiants de démonstration <strong>Test/Test</strong> pour accéder à la
            simulation.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {ERROR_MESSAGE}
          </p>
        )}

        <form method="post" action="/api/login" className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="identifiant" className="text-sm font-medium text-gray-700">
              Identifiant
            </label>
            <input
              id="identifiant"
              name="identifiant"
              type="text"
              required
              autoComplete="username"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="motdepasse" className="text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="motdepasse"
              name="motdepasse"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-base font-semibold text-white shadow hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Se connecter
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Besoin d’aide ? <Link href="mailto:support@example.com" className="text-blue-600 hover:underline">Contactez-nous</Link>.
        </p>
      </div>
    </main>
  )
}
