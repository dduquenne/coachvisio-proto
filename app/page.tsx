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

  const handleSend = async (msg: Message) => {
    setMessages(prev => [...prev, msg])

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        persona,
        lastUserMessage: msg.content,
      }),
    })

    const data = await res.json()

    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: "assistant", content: data.reply },
    ])
  }

  const handleClear = () => {
    setMessages([])
  }

  return (
    <main className="flex flex-col gap-4 max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Simulation d’entretien</h1>
      <PersonaSelect value={persona} onChange={setPersona} />
      <Timer />
      <MessageList messages={messages} />
      <Composer onSend={handleSend} />
      <Controls onClear={handleClear} />
    </main>
  )
}
