"use client"

import { useEffect, useRef, ReactNode } from "react"

export type Message = {
  id: string
  role: "user" | "assistant" | "error"
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
        let content: ReactNode = msg.content

        if (msg.role === "user") {
          bubbleStyle = "bg-blue-500 text-white self-end"
        } else if (msg.role === "assistant") {
          bubbleStyle = "bg-gray-200 text-gray-800 self-start"
          if (msg.content === "") {
            content = <span className="animate-pulse">…</span>
          }
        } else if (msg.role === "error") {
          bubbleStyle =
            "bg-red-100 text-red-700 border border-red-400 self-start"
          content = `⚠️ ${msg.content}`
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
