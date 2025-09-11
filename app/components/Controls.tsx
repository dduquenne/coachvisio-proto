"use client"

import { Message } from "@/app/components/MessageList"
import jsPDF from "jspdf"

type Props = {
  onClear: () => void
  messages: Message[]
  summary: string | null
}

export default function Controls({ onClear, messages, summary }: Props) {
  const handleDownload = () => {
    if (!summary) return
    const doc = new jsPDF()
    let y = 10

    messages.forEach(msg => {
      const role =
        msg.role === "user"
          ? "Utilisateur"
          : msg.role === "assistant"
          ? "Assistant"
          : "Erreur"
      const lines = doc.splitTextToSize(`${role} : ${msg.content}`, 180)
      if (y + lines.length * 7 > 280) {
        doc.addPage()
        y = 10
      }
      doc.text(lines, 10, y)
      y += lines.length * 7
    })

    doc.addPage()
    doc.setFont("helvetica", "bold")
    doc.text("Synthèse", 10, 10)
    doc.setFont("helvetica", "normal")
    const summaryLines = doc.splitTextToSize(summary, 180)
    doc.text(summaryLines, 10, 20)
    doc.save("conversation.pdf")
  }

  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={onClear}
        className="rounded-2xl bg-gray-300 px-4 py-2 text-gray-800 shadow hover:bg-gray-400"
      >
        Effacer la conversation
      </button>
      {summary && (
        <button
          onClick={handleDownload}
          className="rounded-2xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
        >
          Télécharger le PDF
        </button>
      )}
    </div>
  )
}
