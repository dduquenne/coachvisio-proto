"use client"

// 🧭 Page principale de simulation d'entretien. Elle orchestre l'avatar,
// la reconnaissance vocale, le minuteur et la génération des réponses IA.
import LandingLogo from "@/app/components/landing/LandingLogo"
import Timer, { TimerState } from "@/app/components/Timer"
import MessageList, { Message } from "@/app/components/MessageList"
import Composer from "@/app/components/Composer"
import Avatar, { AvatarHandle } from "@/app/components/Avatar"
import { useSessionTime } from "@/app/context/SessionTimeContext"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PERSONAS, PersonaId, isPersonaId } from "@/app/personas"
import { Loader2, Pause, Play, Square } from "lucide-react"

type InterviewPageClientProps = {
  initialPersonaId?: PersonaId
}

export default function InterviewPageClient({
  initialPersonaId = "manager",
}: InterviewPageClientProps) {
  // 💬 Historique de la conversation et état de la simulation
  const persona = useMemo<PersonaId>(
    () => (isPersonaId(initialPersonaId) ? initialPersonaId : "manager"),
    [initialPersonaId],
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [summaryGenerated, setSummaryGenerated] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryWindowOpened, setSummaryWindowOpened] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null)
  // Référence vers l'avatar 3D pour lui attacher l'analyseur audio
  const avatarRef = useRef<AvatarHandle>(null)
  const { deductTime, persistRemaining } = useSessionTime()
  const previousTimerStateRef = useRef<TimerState>(timerState)

  useEffect(() => {
    if (timerState !== "running") {
      return
    }

    let lastTick = Date.now()

    const intervalId = window.setInterval(() => {
      const now = Date.now()
      const delta = now - lastTick
      lastTick = now
      deductTime(delta)
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
      const now = Date.now()
      const delta = now - lastTick
      if (delta > 0) {
        deductTime(delta)
      }
    }
  }, [timerState, deductTime])

  useEffect(() => {
    if (
      previousTimerStateRef.current === "running" &&
      timerState !== "running"
    ) {
      persistRemaining()
    }

    previousTimerStateRef.current = timerState
  }, [timerState, persistRemaining])

  // 🔊 Déclenche la synthèse vocale d'un texte généré par l'IA.
  // On récupère un flux audio depuis notre API puis on le joue dans le navigateur.
  const speak = async (text: string, personaId: PersonaId) => {
    if (typeof window === "undefined" || !text) return
    try {
      const res = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: PERSONAS[personaId].voice }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      let started = false
      audio.addEventListener("play", () => {
        started = true
        window.dispatchEvent(new Event("assistant-speaking-start"))
      })
      const stopEvent = () => {
        if (started) {
          window.dispatchEvent(new Event("assistant-speaking-end"))
        }
        audio.removeEventListener("ended", stopEvent)
        audio.removeEventListener("error", stopEvent)
      }
      audio.addEventListener("ended", stopEvent)
      audio.addEventListener("error", stopEvent)
      await avatarRef.current?.attachAudioAnalyser(audio)
      await audio.play().catch(e => {
        console.error("Erreur lecture audio", e)
      })
    } catch (e) {
      console.error("Erreur de synthèse vocale", e)
    }
  }

  // ✉️ Envoi d'un message utilisateur et gestion du flux de réponse de l'IA.
  // On ajoute d'abord le message dans l'historique puis on écoute la réponse
  // en streaming pour l'afficher progressivement.
  const handleSend = async (msg: Message) => {
    if (timerState !== "running") return

    const baseId = Date.now().toString()
    const userId = baseId + "-u"
    const assistantId = baseId + "-a"

    const userMsg = { ...msg, id: userId, role: "user" as const }
    setMessages(prev => [...prev, userMsg])

    setMessages(prev => [
      ...prev,
      { id: assistantId, role: "assistant" as const, content: "" },
    ])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, lastUserMessage: msg.content }),
      })

      if (!res.ok || !res.body) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? {
                  ...m,
                  role: "error" as const,
                  content: `[Erreur ${res.status}] Impossible de générer la réponse.`,
                }
              : m
          )
        )
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let fullText = ""

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: m.content + chunk }
                : m
            )
          )
        }
        done = readerDone
      }
      await speak(fullText, persona)
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                role: "error" as const,
                content: `[Erreur réseau] Impossible de contacter le serveur.`,
              }
            : m
        )
      )
    }
  }

  // 🤫 Gestion d'un silence prolongé de l'utilisateur : on force l'IA
  // à relancer la conversation pour maintenir le rythme de l'entretien.
  const handleSilence = async () => {
    if (timerState !== "running") return

    const baseId = Date.now().toString()
    const assistantId = baseId + "-a"

    setMessages(prev => [
      ...prev,
      { id: assistantId, role: "assistant" as const, content: "" },
    ])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          lastUserMessage: "L'utilisateur reste silencieux depuis 10 secondes.",
        }),
      })

      if (!res.ok || !res.body) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? {
                  ...m,
                  role: "error" as const,
                  content: `[Erreur ${res.status}] Impossible de relancer la conversation.`,
                }
              : m
          )
        )
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: m.content + chunk }
                : m
            )
          )
        }
        done = readerDone
      }
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                role: "error" as const,
                content: `[Erreur réseau] Impossible de relancer la conversation.`,
              }
            : m
        )
      )
    }
  }

  // ✅ Génération automatique de la synthèse finale dès que le timer se termine.
  const generateSummary = useCallback(async (): Promise<string | null> => {
    if (summary && summaryGenerated) {
      return summary
    }

    if (summaryLoading) {
      return summary
    }

    setSummaryLoading(true)

    try {
      const res = await fetch("/api/chat-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: messages }),
      })

      if (res.ok) {
        const data = await res.json()
        setSummary(data.summary)
        setSummaryGenerated(true)
        return data.summary
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "error" as const,
          content: `[Erreur ${res.status}] Impossible de générer la synthèse.`,
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "error" as const,
          content: `[Erreur réseau] Impossible de générer la synthèse.`,
        },
      ])
    } finally {
      setSummaryLoading(false)
    }

    return null
  }, [messages, summary, summaryGenerated, summaryLoading])

  // 🧹 Réinitialisation complète de la session : conversation, minuteur et synthèse.
  const handleClear = useCallback(() => {
    setMessages([])
    setTimerState("idle")
    setSummaryGenerated(false)
    setSummaryLoading(false)
    setSummary(null)
    setSummaryWindowOpened(false)
    setElapsedSeconds(null)
  }, [])

  const openSummaryWindow = useCallback(
    async (durationSeconds: number) => {
      const generatedSummary = await generateSummary()
      if (!generatedSummary || typeof window === "undefined") {
        return
      }

      const payload = {
        summary: generatedSummary,
        persona,
        durationSeconds: Math.max(0, Math.round(durationSeconds)),
        messages,
      }

      const storageKey = `coachvisio-live-report-${Date.now()}`

      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify(payload))
      } catch {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "error" as const,
            content:
              "⚠️ Impossible de préparer le bilan. Veuillez libérer de l'espace de stockage local.",
          },
        ])
        return
      }

      const reportWindow = window.open(
        `/reports/live?key=${encodeURIComponent(storageKey)}`,
        "coachvisio-report",
        "width=960,height=720",
      )

      if (!reportWindow) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "error" as const,
            content:
              "⚠️ Impossible d’ouvrir la fenêtre du bilan. Autorisez l’ouverture de fenêtres pop-up et réessayez.",
          },
        ])
        return
      }

      setSummaryWindowOpened(true)
    },
    [generateSummary, persona, messages],
  )

  useEffect(() => {
    if (
      timerState !== "finished" ||
      elapsedSeconds == null ||
      summaryWindowOpened
    ) {
      return
    }

    void openSummaryWindow(elapsedSeconds)
  }, [elapsedSeconds, openSummaryWindow, summaryWindowOpened, timerState])

  const personaData = PERSONAS[persona]

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#050b19] via-[#0b1832] to-[#040711]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(129,140,248,0.2),_transparent_55%)]" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 pb-12 pt-8 text-white md:px-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <LandingLogo />
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 shadow-lg shadow-cyan-500/10">
            Simulation · {personaData.label}
          </div>
        </header>

        <div className="mt-10 grid flex-1 gap-8 lg:grid-cols-[minmax(0,_3fr)_minmax(0,_2fr)]">
          <section className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/5 shadow-2xl shadow-cyan-500/20 backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent" aria-hidden="true" />
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900/60">
              <div className="absolute inset-0">
                <Avatar ref={avatarRef} />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050b19]/85 to-transparent" aria-hidden="true" />

            <Timer
              onStateChange={state => {
                setTimerState(state)
              }}
              onStop={value => {
                setElapsedSeconds(Math.round(value))
              }}
            >
              {({ formattedRemaining, state, start, pause, stop }) => {
                const handleStartClick = () => {
                  if (state === "running") return
                  if (state === "paused") {
                    start()
                    return
                  }
                  if (messages.length > 0) {
                    handleClear()
                  }
                  start()
                }

                return (
                  <>
                    <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/70 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/30">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
                      <span>Temps restant {formattedRemaining}</span>
                    </div>

                    <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/20 bg-slate-900/80 px-6 py-3 shadow-2xl shadow-cyan-500/30">
                      <button
                        type="button"
                        onClick={handleStartClick}
                        disabled={state === "running"}
                        aria-label={
                          state === "paused"
                            ? "Reprendre la simulation"
                            : state === "finished"
                              ? "Relancer une nouvelle simulation"
                              : "Démarrer la simulation"
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Play className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={pause}
                        disabled={state !== "running"}
                        aria-label="Mettre la simulation en pause"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white shadow-lg shadow-cyan-500/30 transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Pause className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={stop}
                        disabled={state === "idle"}
                        aria-label="Arrêter la simulation"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/90 text-white shadow-lg shadow-rose-500/40 transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Square className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                )
              }}
            </Timer>
          </section>

          <section className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-cyan-500/20 backdrop-blur">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">
                  Dialogue en cours
                </span>
                <span className="text-xl font-semibold text-white">
                  {personaData.label}
                </span>
                <span className="text-sm text-white/60">{personaData.role}</span>
              </div>

              <MessageList className="mt-5" messages={messages} />
            </div>

            <Composer
              onSend={msg =>
                handleSend({ ...msg, id: "", role: "user", content: msg.content })
              }
              onSilence={handleSilence}
              disabled={timerState !== "running"}
            />

            {summaryLoading && (
              <div className="flex items-center gap-3 rounded-3xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-cyan-500/10">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyse du bilan en cours…
              </div>
            )}

            {summaryWindowOpened && !summaryLoading && (
              <div className="rounded-3xl border border-emerald-300/50 bg-emerald-500/20 px-5 py-3 text-sm font-semibold text-emerald-100 shadow-lg shadow-emerald-500/30">
                ✅ Votre bilan s’est ouvert dans une nouvelle fenêtre.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
