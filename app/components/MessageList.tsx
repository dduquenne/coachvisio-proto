"use client"

// 💬 Affichage des échanges sous forme de bulles colorées et scroll automatique.
import { useEffect, useRef, ReactNode } from "react"

export type Message = {
  id: string
  role: "user" | "assistant" | "error"
  content: string
}

type Props = {
  messages: Message[]
  className?: string
}

export default function MessageList({ messages, className = "" }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null)

  // 🎯 Scroll automatique vers le bas à chaque nouveau message.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div
      className={`flex h-[26rem] flex-col gap-3 overflow-y-auto rounded-3xl border border-white/15 bg-white/5 p-5 text-white shadow-inner shadow-cyan-500/20 ${className}`}
    >
      {messages.map(msg => {
        let bubbleStyle = ""
        let content: ReactNode = msg.content

        // 🎨 Style conditionnel suivant l'émetteur du message.
        if (msg.role === "user") {
          bubbleStyle = "self-end bg-indigo-500/80 text-white shadow-indigo-500/30"
        } else if (msg.role === "assistant") {
          bubbleStyle = "self-start bg-white/15 text-white"
          if (msg.content === "") {
            content = <span className="animate-pulse">…</span>
          }
        } else if (msg.role === "error") {
          bubbleStyle =
            "self-start border border-rose-300/60 bg-rose-500/90 text-white"
          content = `⚠️ ${msg.content}`
        }

        return (
          <div
            key={msg.id}
            className={`max-w-[70%] rounded-3xl px-4 py-2 text-sm leading-relaxed shadow-lg ${bubbleStyle}`}
          >
            {content}
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
