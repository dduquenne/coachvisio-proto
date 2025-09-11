"use client"

import { useEffect, useRef } from "react"

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

type Props = {
  messages: Message[]
}

export default function MessageList({ messages }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null)

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col gap-3 h-[50vh] overflow-y-auto p-4 rounded-2xl shadow bg-white">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`max-w-[70%] px-3 py-2 rounded-2xl shadow ${
            msg.role === "user"
              ? "bg-blue-500 text-white self-end"
              : "bg-gray-200 text-gray-800 self-start"
          }`}
        >
          {msg.content}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}
