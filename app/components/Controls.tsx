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
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 10
    const maxBubbleWidth = 120
    const lineHeight = 6
    let y = margin

    messages.forEach(msg => {
      const textLines = doc.splitTextToSize(msg.content, maxBubbleWidth)
      const textWidth = Math.max(...textLines.map(line => doc.getTextWidth(line)))
      const bubbleWidth = textWidth + 10
      const bubbleHeight = textLines.length * lineHeight + 4

      if (y + bubbleHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
      }

      let x = margin
      let fill: [number, number, number] = [229, 231, 235]
      let textColor: [number, number, number] = [31, 41, 55]
      let draw: [number, number, number] | null = null

      if (msg.role === "user") {
        x = pageWidth - margin - bubbleWidth
        fill = [59, 130, 246]
        textColor = [255, 255, 255]
      } else if (msg.role === "error") {
        fill = [254, 226, 226]
        textColor = [185, 28, 28]
        draw = [252, 165, 165]
      }

      if (draw) doc.setDrawColor(...draw)
      doc.setFillColor(...fill)
      doc.setTextColor(...textColor)
      doc.roundedRect(x, y, bubbleWidth, bubbleHeight, 5, 5, draw ? "FD" : "F")
      doc.text(textLines, x + 5, y + lineHeight)
      y += bubbleHeight + 4
    })

    doc.addPage()
    y = margin
    doc.setTextColor(0, 0, 0)
    const lines = summary.split("\n")

    lines.forEach(line => {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }

      if (line.startsWith("# ")) {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(16)
        doc.text(line.slice(2), margin, y)
        y += 8
      } else if (line.startsWith("## ")) {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(14)
        doc.text(line.slice(3), margin, y)
        y += 7
      } else if (line.startsWith("- ")) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(12)
        const bulletLines = doc.splitTextToSize(line.slice(2), pageWidth - margin * 2 - 6)
        const formatted = bulletLines.map((l, i) => (i === 0 ? `• ${l}` : `  ${l}`))
        doc.text(formatted, margin + 2, y)
        y += bulletLines.length * lineHeight
      } else if (line.trim() === "") {
        y += lineHeight
      } else {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(12)
        const paragraph = doc.splitTextToSize(line, pageWidth - margin * 2)
        doc.text(paragraph, margin, y)
        y += paragraph.length * lineHeight
      }
    })

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
