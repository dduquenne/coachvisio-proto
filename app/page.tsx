"use client"

import PersonaSelect from "@/app/components/PersonaSelect"
import Timer from "@/app/components/Timer"
import MessageList, { Message } from "@/app/components/MessageList"
import Composer from "@/app/components/Composer"
import Controls from "@/app/components/Controls"
import { useState } from "react"

export default function InterviewPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [persona, setPersona] = useState("manager")
  const [timerState, setTimerState] = useState<"idle" | "running" | "finished">("idle")
  const [summaryGenerated, setSummaryGenerated] = useState(false) // ✅ verrou

  const handleSend = async (msg: Message) => {
    if (timerState !== "running") return // 🔒 bloque hors chrono

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
                content: `[Erreur réseau] Impossible de contacter le serveur.`,
              }
            : m
        )
      )
    }
  }

  // ✅ Génération de synthèse automatique avec verrou
  const generateSummary = async () => {
    if (summaryGenerated) return
    setSummaryGenerated(true)

    try {
      const res = await fetch("/api/chat-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: messages }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "summary" as const,
            content: data.summary,
          },
        ])
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
    }
  }

  const handleClear = () => {
    setMessages([])
    setTimerState("idle")
    setSummaryGenerated(false) // ✅ reset du verrou
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
      />
      <MessageList messages={messages} />
      <Composer
        onSend={msg =>
          handleSend({ ...msg, id: "", role: "user", content: msg.content })
        }
        disabled={timerState !== "running"}
      />
      <Controls onClear={handleClear} />
    </main>
  )
}
