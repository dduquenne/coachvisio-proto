import Link from "next/link"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"

import LandingLogo from "@/app/components/landing/LandingLogo"
import { SESSION_COOKIE_NAME } from "@/app/lib/auth"
import { getReportFile } from "@/app/lib/reports"
import { PERSONAS } from "@/app/personas"

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")
  return `${mins}:${secs}`
}

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = cookies().get(SESSION_COOKIE_NAME)
  if (!session) {
    redirect("/login")
  }

  const reportFile = await getReportFile(params.id)
  if (!reportFile) {
    notFound()
  }

  const { record } = reportFile
  const persona = PERSONAS[record.persona]
  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  })

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#050b19] via-[#0b1832] to-[#040711]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(129,140,248,0.2),_transparent_55%)]" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 pb-12 pt-8 md:px-12">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <LandingLogo />
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/reports"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-200/80 hover:bg-cyan-500/20"
            >
              ← Retour aux bilans
            </Link>
            <Link
              href={`/api/reports/${record.id}?download=1`}
              className="inline-flex items-center justify-center rounded-full border border-cyan-200/60 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200 hover:bg-cyan-400/40"
            >
              Télécharger le PDF
            </Link>
          </div>
        </header>

        <section className="mt-12 flex flex-1 flex-col gap-8 text-white">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,_0.9fr)_minmax(0,_1.1fr)]">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                Synthèse du bilan
              </p>
              <h1 className="mt-4 text-3xl font-bold text-white">{persona.label}</h1>
              <p className="mt-2 text-base text-white/70">{persona.role}</p>

              <dl className="mt-6 space-y-4 text-white/80">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/50">Date de génération</dt>
                  <dd className="text-base font-medium text-white">
                    {dateFormatter.format(new Date(record.createdAt))}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/50">Durée de la simulation</dt>
                  <dd className="text-base font-medium text-white">
                    {formatDuration(record.durationSeconds)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/50">Fichier</dt>
                  <dd className="text-base font-medium text-white">{record.fileName}</dd>
                </div>
              </dl>
            </div>

            <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl shadow-cyan-500/10">
              <div className="border-b border-white/10 bg-white/5 px-6 py-4">
                <p className="text-sm font-semibold text-white/80">Aperçu du rapport</p>
                <p className="text-xs text-white/60">Le PDF est affiché dans la visionneuse ci-dessous.</p>
              </div>
              <div className="flex-1">
                <iframe
                  key={record.id}
                  src={`/api/reports/${record.id}`}
                  title={`Rapport PDF pour ${persona.label}`}
                  className="h-full w-full border-0"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
