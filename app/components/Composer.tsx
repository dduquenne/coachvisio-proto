"use client"

import { useState } from "react"
import type { Message } from "./MessageList"

type Props = {
  onSend: (msg: Message) => void
  disabled?: boolean
}

export default function Composer({ onSend, disabled }: Props) {
  const [text, setText] = useState("")

  const handleSend = () => {
    if (!text.trim() || disabled) return
    onSend({
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    })
    setText("")
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-2xl shadow bg-gray-50">
      <div className="flex items-center gap-2">
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
          placeholder={
            disabled ? "⏱️ Lancez le timer pour commencer" : "Écrire un message..."
          }
          disabled={disabled}
          className="flex-1 rounded border px-3 py-2 disabled:bg-gray-100"
        />
        <button
          onClick={handleSend}
          disabled={disabled}
          className="rounded-2xl bg-blue-600 px-4 py-2 text-white shadow disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>

      {disabled && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          ⏱️ Lancez le timer pour commencer l’entretien
        </p>
      )}
    </div>
  )
}
