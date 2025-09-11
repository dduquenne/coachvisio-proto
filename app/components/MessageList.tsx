"use client"

import { useEffect, useRef, ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

export type Message = {
  id: string
  role: "user" | "assistant" | "error" | "summary"
  content: string
}

type Props = {
  messages: Message[]
}

export default function MessageList({ messages }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col gap-3 h-[50vh] overflow-y-auto p-4 rounded-2xl shadow bg-white">
      {messages.map(msg => {
        let bubbleStyle = ""
        let content: ReactNode = msg.content   // ✅ ReactNode au lieu de JSX

        if (msg.role === "user") {
          bubbleStyle = "bg-blue-500 text-white self-end"
        } else if (msg.role === "assistant") {
          bubbleStyle = "bg-gray-200 text-gray-800 self-start"
          if (msg.content === "") {
            content = <span className="animate-pulse">…</span>
          }
        } else if (msg.role === "error") {
          bubbleStyle =
            "bg-red-100 text-red-700 border border-red-400 self-start flex items-center gap-2"
          content = (
            <>
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{msg.content}</span>
            </>
          )
        } else if (msg.role === "summary") {
          bubbleStyle =
            "bg-green-100 text-green-800 border border-green-400 self-start whitespace-pre-line"
        }

        return (
          <div
            key={msg.id}
            className={`max-w-[70%] px-3 py-2 rounded-2xl shadow ${bubbleStyle}`}
          >
            {content}
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
