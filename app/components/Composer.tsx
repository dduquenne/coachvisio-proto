"use client"

import { useState } from "react"
import type { Message } from "./MessageList"

type Props = {
  onSend: (msg: Message) => void
}

export default function Composer({ onSend }: Props) {
  const [text, setText] = useState("")

  const handleSend = () => {
    if (!text.trim()) return
    onSend({
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    })
    setText("")
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-2xl shadow bg-gray-50">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
          }
        }}
        placeholder="Écrire un message..."
        className="flex-1 rounded border px-3 py-2"
      />
      <button
        onClick={handleSend}
        className="rounded-2xl bg-blue-600 px-4 py-2 text-white shadow"
      >
        Envoyer
      </button>
    </div>
  )
}
