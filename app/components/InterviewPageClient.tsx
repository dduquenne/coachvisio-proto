"use client"

// 🧭 Page principale de simulation d'entretien. Elle orchestre l'avatar,
// la reconnaissance vocale, le minuteur et la génération des réponses IA.
import PersonaSelect from "@/app/components/PersonaSelect"
import Timer from "@/app/components/Timer"
import MessageList, { Message } from "@/app/components/MessageList"
import Composer from "@/app/components/Composer"
import Controls, {
  downloadConversationPdf,
} from "@/app/components/Controls"
import Avatar, { AvatarHandle } from "@/app/components/Avatar"
import { useSessionTime } from "@/app/context/SessionTimeContext"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { PERSONAS, PersonaId, isPersonaId } from "@/app/personas"
import SummaryModal from "@/app/components/SummaryModal"

export default function InterviewPageClient() {
  // 💬 Historique de la conversation et état de la simulation
  const [messages, setMessages] = useState<Message[]>([])
  const searchParams = useSearchParams()
  const personaFromQuery = searchParams.get("persona")
  const [persona, setPersona] = useState<PersonaId>(() =>
    isPersonaId(personaFromQuery) ? personaFromQuery : "manager"
  )
  const [timerState, setTimerState] = useState<"idle" | "running" | "finished">("idle")
  const [summaryGenerated, setSummaryGenerated] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null)
  const lastPersonaFromQuery = useRef<string | null>(personaFromQuery)
  // Référence vers l'avatar 3D pour lui attacher l'analyseur audio
  const avatarRef = useRef<AvatarHandle>(null)
  const { deductTime, persistRemaining } = useSessionTime()
  const previousTimerStateRef = useRef<typeof timerState>(timerState)

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

  useEffect(() => {
    if (lastPersonaFromQuery.current === personaFromQuery) {
      return
    }

    lastPersonaFromQuery.current = personaFromQuery

    if (isPersonaId(personaFromQuery)) {
      setPersona(personaFromQuery)
    } else {
      setPersona("manager")
    }
  }, [personaFromQuery])

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
  const generateSummary = async () => {
    if (summaryGenerated || summaryLoading) return
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
        setIsSummaryModalOpen(true)
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "error" as const,
            content: `[Erreur ${res.status}] Impossible de générer la synthèse.`,
          },
        ])
      }
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
  }

  // 🧹 Réinitialisation complète de la session : conversation, minuteur et synthèse.
  const handleClear = () => {
    setMessages([])
    setTimerState("idle")
    setSummaryGenerated(false)
    setSummaryLoading(false)
    setSummary(null)
    setIsSummaryModalOpen(false)
    setElapsedSeconds(null)
  }

  const handleSummaryListen = () => {
    if (!summary) return
    void speak(summary, persona)
  }

  const handleSummaryDownload = () => {
    if (!summary) return
    downloadConversationPdf({
      messages,
      summary,
      persona,
      durationSeconds: elapsedSeconds ?? 0,
    })
  }

  return (
    <main className="flex flex-col gap-4 max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Simulation d’entretien</h1>
      <PersonaSelect value={persona} onChange={setPersona} />
      <Timer
        onStateChange={(state) => {
          setTimerState(state)
          if (state === "finished") {
            generateSummary()
          }
        }}
        onStop={(elapsedSeconds) => {
          setElapsedSeconds(Math.round(elapsedSeconds))
        }}
      />
      <div className="flex flex-col items-center gap-4">
        <div className="w-128 h-128" style={{ position: "relative", top: 0, left: 96 }}>
          <Avatar ref={avatarRef} />
        </div>
        <Composer
          onSend={msg =>
            handleSend({ ...msg, id: "", role: "user", content: msg.content })
          }
          onSilence={handleSilence}
          disabled={timerState !== "running"}
        />
      </div>
      <MessageList messages={messages} />

      {summaryLoading && (
        <div className="rounded-2xl shadow bg-yellow-100 text-yellow-800 p-4">
          ⏳ Analyse de la conversation en cours…
        </div>
      )}

      {summary && !isSummaryModalOpen && (
        <div className="flex justify-center">
          <button
            onClick={() => setIsSummaryModalOpen(true)}
            className="rounded-2xl bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700"
          >
            Afficher la synthèse
          </button>
        </div>
      )}

      {/* Boutons de reset et export PDF */}
      <Controls
        onClear={handleClear}
        messages={messages}
        summary={summary}
        persona={persona}
        durationSeconds={elapsedSeconds}
      />

      {summary && isSummaryModalOpen && (
        <SummaryModal
          summary={summary}
          onListen={handleSummaryListen}
          onDownload={handleSummaryDownload}
          onClose={handleClear}
        />
      )}
    </main>
  )
}
