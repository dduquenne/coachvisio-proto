"use client"

import PersonaSelect from "@/app/components/PersonaSelect"
import Timer from "@/app/components/Timer"
import MessageList, { Message } from "@/app/components/MessageList"
import Composer from "@/app/components/Composer"
import Controls from "@/app/components/Controls"
import { useState } from "react"
import ReactMarkdown from "react-markdown"

export default function InterviewPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [persona, setPersona] = useState("manager")
  const [timerState, setTimerState] = useState<"idle" | "running" | "finished">("idle")
  const [summaryGenerated, setSummaryGenerated] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

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

  // ✅ Génération de synthèse automatique
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

  const handleClear = () => {
    setMessages([])
    setTimerState("idle")
    setSummaryGenerated(false)
    setSummaryLoading(false)
    setSummary(null)
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

      {summaryLoading && (
        <div className="rounded-2xl shadow bg-yellow-100 text-yellow-800 p-4">
          ⏳ Analyse de la conversation en cours…
        </div>
      )}

      {summary && (
        <div className="rounded-2xl shadow bg-green-50 text-green-900 border border-green-300 p-6">
          <ReactMarkdown
            components={{
              h1: ({ ...props }) => (
                <h1
                  className="text-2xl font-bold text-green-800 mb-4 border-b pb-2"
                  {...props}
                />
              ),
              h2: ({ ...props }) => (
                <h2
                  className="text-xl font-semibold text-green-700 mt-4 mb-2"
                  {...props}
                />
              ),
              ul: ({ ...props }) => (
                <ul className="list-disc list-inside space-y-1" {...props} />
              ),
              li: ({ ...props }) => (
                <li className="leading-snug" {...props} />
              ),
              p: ({ ...props }) => (
                <p className="my-1 leading-relaxed" {...props} />
              ),
            }}
          >
            {summary}
          </ReactMarkdown>
        </div>
      )}

      <Composer
        onSend={msg =>
          handleSend({ ...msg, id: "", role: "user", content: msg.content })
        }
        disabled={timerState !== "running"}
      />
      <Controls onClear={handleClear} messages={messages} summary={summary} />
    </main>
  )
}
