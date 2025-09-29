"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import ReactMarkdown from "react-markdown"

import LandingLogo from "@/app/components/landing/LandingLogo"
import { downloadConversationPdf } from "@/app/components/Controls"
import type { Message } from "@/app/components/MessageList"
import { PERSONAS, PersonaId } from "@/app/personas"
import { ArrowLeft, Download, Loader2 } from "lucide-react"

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")
  return `${mins}:${secs}`
}

type SummaryPayload = {
  summary: string
  persona: PersonaId
  durationSeconds: number
  messages: Message[]
}

export default function LiveReportPage() {
  const searchParams = useSearchParams()
  const storageKey = searchParams.get("key")
  const [data, setData] = useState<SummaryPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!storageKey) {
      setError("Aucun bilan à afficher.")
      return
    }

    if (typeof window === "undefined") return

    let raw: string | null = null
    try {
      raw = window.localStorage.getItem(storageKey)
    } catch {
      setError("Impossible de lire les données du bilan.")
      return
    }
    if (!raw) {
      setError("Les données du bilan sont introuvables ou ont expiré.")
      return
    }

    try {
      const parsed = JSON.parse(raw) as SummaryPayload
      setData(parsed)
    } catch {
      setError("Impossible de lire les données du bilan.")
      return
    } finally {
      window.localStorage.removeItem(storageKey)
    }
  }, [storageKey])

  const persona = useMemo(() => {
    if (!data) return null
    return PERSONAS[data.persona]
  }, [data])

  const handleDownload = () => {
    if (!data) return
    downloadConversationPdf({
      messages: data.messages,
      summary: data.summary,
      persona: data.persona,
      durationSeconds: data.durationSeconds,
    })
  }

  const handleReturn = () => {
    if (typeof window === "undefined") return
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.location.href = "/"
      } catch {
        // ignore cross-origin errors
      }
    }
    window.close()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#050b19] via-[#0b1832] to-[#040711] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(129,140,248,0.2),_transparent_55%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 pb-12 pt-10 md:px-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <LandingLogo />
          {persona && (
            <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 shadow-lg shadow-cyan-500/10">
              {persona.label}
              <span className="text-white/40">·</span>
              <span>{persona.role}</span>
            </div>
          )}
        </header>

        {error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl border border-rose-400/60 bg-rose-500/20 p-8 text-center text-rose-100 shadow-lg shadow-rose-500/30">
            <p className="text-lg font-semibold">{error}</p>
            <button
              onClick={handleReturn}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:border-rose-200/60 hover:bg-rose-400/40"
            >
              <ArrowLeft className="h-4 w-4" />
              Retourner à la sélection d’avatars
            </button>
          </div>
        ) : data && persona ? (
          <>
            <section className="flex flex-1 flex-col gap-6 rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl shadow-cyan-500/20 backdrop-blur">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                  Bilan de votre simulation
                </span>
                <h1 className="text-3xl font-bold text-white">
                  Résumé personnalisé avec {persona.label}
                </h1>
                <p className="text-sm text-white/60">
                  Durée de la simulation&nbsp;: {formatDuration(data.durationSeconds)}
                </p>
              </div>

              <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/30 p-6 shadow-inner shadow-cyan-500/20">
                <ReactMarkdown
                  className="prose prose-invert max-w-none text-white/90"
                  components={{
                    h1: props => (
                      <h1 className="text-2xl font-semibold text-white" {...props} />
                    ),
                    h2: props => (
                      <h2 className="mt-6 text-xl font-semibold text-white" {...props} />
                    ),
                    ul: props => (
                      <ul className="list-disc space-y-2 pl-6 text-white/90" {...props} />
                    ),
                  }}
                >
                  {data.summary}
                </ReactMarkdown>
              </div>
            </section>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-500/90 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400"
              >
                <Download className="h-4 w-4" />
                Télécharger le PDF
              </button>
              <button
                onClick={handleReturn}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-200/70 hover:bg-cyan-500/20"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour aux avatars
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl shadow-cyan-500/20">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm text-white/70">Préparation du bilan…</p>
          </div>
        )}
      </div>
    </main>
  )
}
