"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo } from "react"

import LandingLogo from "@/app/components/landing/LandingLogo"
import { useSessionTime } from "@/app/context/SessionTimeContext"
import type { ReportRecord } from "@/app/lib/reports"
import { PERSONAS } from "@/app/personas"

type DashboardClientProps = {
  reports: ReportRecord[]
}

const formatRemaining = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000))
  const totalMinutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours} h ${minutes.toString().padStart(2, "0")} min`
  }

  return `${minutes.toString().padStart(2, "0")} min ${seconds
    .toString()
    .padStart(2, "0")} s`
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")

  return `${mins}:${secs}`
}

export default function DashboardClient({ reports }: DashboardClientProps) {
  const { remainingMs } = useSessionTime()

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  )

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
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow transition hover:border-cyan-200/80 hover:bg-cyan-500/20"
            >
              Consulter mes bilans
            </Link>
          </div>
        </header>

        <section className="mt-12 flex flex-1 flex-col gap-10 text-white">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Préparez votre prochain entretien immersif
              </h1>
              <p className="mt-3 max-w-2xl text-base text-white/70">
                Choisissez une persona pour lancer une simulation instantanément, visualisez votre temps de coaching restant et retrouvez vos bilans détaillés pour suivre votre progression.
              </p>
            </div>

            <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-cyan-400/30 via-cyan-500/20 to-indigo-500/30 p-8 shadow-2xl shadow-indigo-500/20">
              <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
                Temps de coaching disponible
              </p>
              <p className="mt-4 text-4xl font-bold text-white">
                {formatRemaining(remainingMs)}
              </p>
              <p className="mt-2 text-sm text-white/70">
                Ce crédit est partagé entre toutes vos simulations en cours de journée.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Personas disponibles</h2>
                <p className="text-sm text-white/70">
                  Sélectionnez un profil pour démarrer immédiatement une nouvelle simulation.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(PERSONAS).map(([id, persona]) => {
                const intro = persona.scenario.split("\n")[0]
                return (
                  <Link
                    key={id}
                    href={`/simulations/${id}`}
                    className="group relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-cyan-500/10 transition hover:-translate-y-1 hover:border-cyan-300/60 hover:bg-white/10"
                  >
                    <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-inner">
                      <Image
                        src={persona.avatar}
                        alt={`Avatar ${persona.label}`}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-semibold text-white">{persona.label}</span>
                      <span className="text-sm text-white/70">{persona.role}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-white/70">
                      {intro}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                      Lancer la simulation
                      <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Bilans disponibles</h2>
                <p className="text-sm text-white/70">
                  Consultez les synthèses PDF générées à la fin de vos entretiens.
                </p>
              </div>
              <Link
                href="/reports"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/70 hover:bg-cyan-500/20"
              >
                Voir tous les bilans
              </Link>
            </div>

            {reports.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-6 text-center text-white/70">
                Aucun bilan disponible pour le moment. Terminez une simulation pour générer votre premier rapport.
              </div>
            ) : (
              <ul className="mt-6 max-h-[24rem] space-y-4 overflow-y-auto pr-1">
                {reports.map(report => {
                  const persona = PERSONAS[report.persona]
                  return (
                    <li
                      key={report.id}
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-inner shadow-cyan-500/10 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-base font-semibold text-white">
                          {persona.label}
                        </p>
                        <p className="text-sm text-white/60">
                          {dateFormatter.format(new Date(report.createdAt))} · Durée {formatDuration(report.durationSeconds)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/api/reports/${report.id}`}
                          target="_blank"
                          className="inline-flex items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200 hover:bg-cyan-400/40"
                        >
                          Ouvrir
                        </Link>
                        <Link
                          href={`/api/reports/${report.id}?download=1`}
                          className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-200/70 hover:bg-cyan-500/20"
                        >
                          Télécharger
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
