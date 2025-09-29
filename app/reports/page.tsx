import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { listReports } from "@/app/lib/reports"
import { PERSONAS } from "@/app/personas"
import { SESSION_COOKIE_NAME } from "@/app/lib/auth"

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")
  return `${mins}:${secs}`
}

export default async function ReportsPage() {
  const session = cookies().get(SESSION_COOKIE_NAME)
  if (!session) {
    redirect("/login")
  }

  const reports = await listReports()
  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  })

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Rapports générés</h1>
        <p className="text-sm text-gray-600">
          Retrouvez les PDF générés après chaque session avec leurs métadonnées.
        </p>
      </header>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-600">
          Aucun rapport enregistré pour le moment.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Persona
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Durée
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map(report => {
                const persona = PERSONAS[report.persona]
                return (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {dateFormatter.format(new Date(report.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className="font-medium">{persona.label}</span>
                      <span className="text-gray-500"> · {persona.role}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDuration(report.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/reports/${report.id}`}
                          className="rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                        >
                          Visualiser
                        </Link>
                        <Link
                          href={`/api/reports/${report.id}?download=1`}
                          className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          Télécharger
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
