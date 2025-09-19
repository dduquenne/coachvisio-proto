"use client"

// 🧾 Actions finales : remise à zéro de la conversation et export PDF.
import { Message } from "@/app/components/MessageList"
import { PersonaId } from "@/app/personas"
import jsPDF from "jspdf"

type Props = {
  onClear: () => void
  messages: Message[]
  summary: string | null
  persona: PersonaId
  durationSeconds: number | null
}

type DownloadParams = {
  messages: Message[]
  summary: string
  persona: PersonaId
  durationSeconds: number
}

let downloadSequence = 1

export const downloadConversationPdf = ({
  messages,
  summary,
  persona,
  durationSeconds,
}: DownloadParams) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  const lineHeight = 7
  let y = margin

  // 🗨️ Dessine chaque bulle de message avec un code couleur par rôle.
  messages.forEach(msg => {
    const textLines = doc.splitTextToSize(
      msg.content,
      pageWidth - margin * 2 - 20
    )
    const textWidth = textLines.reduce(
      (w: number, line: string) => Math.max(w, doc.getTextWidth(line)),
      0
    )
    const bubbleWidth = textWidth + 6
    const bubbleHeight = textLines.length * lineHeight + 6
    if (y + bubbleHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
    }

    let x = margin
    let fill: [number, number, number] = [229, 231, 235]
    let textColor: [number, number, number] = [31, 41, 55]

    if (msg.role === "user") {
      x = pageWidth - margin - bubbleWidth
      fill = [59, 130, 246]
      textColor = [255, 255, 255]
    } else if (msg.role === "assistant") {
      x = margin
      fill = [229, 231, 235]
      textColor = [31, 41, 55]
    } else {
      x = margin
      fill = [254, 226, 226]
      textColor = [185, 28, 28]
    }

    doc.setFillColor(...fill)
    doc.setTextColor(...textColor)
    doc.roundedRect(x, y, bubbleWidth, bubbleHeight, 4, 4, "F")
    doc.text(textLines, x + 3, y + lineHeight)
    doc.setTextColor(0, 0, 0)
    y += bubbleHeight + 4
  })

  // 🧠 Ajout d'une nouvelle page pour la synthèse structurée.
  doc.addPage()
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Synthèse", margin, margin)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  y = margin + 10

  const pageContentWidth = pageWidth - margin * 2
  summary.split("\n").forEach(line => {
    if (y > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
    if (line.startsWith("# ")) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text(line.slice(2), margin, y)
      y += lineHeight + 2
    } else if (line.startsWith("## ")) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.text(line.slice(3), margin, y)
      y += lineHeight + 2
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(12)
      const listLines = doc.splitTextToSize(
        line.slice(2),
        pageContentWidth - 5
      )
      doc.circle(margin + 2, y - 2, 1.5, "F")
      doc.text(listLines, margin + 5, y)
      y += listLines.length * lineHeight
    } else if (line.trim() === "") {
      y += lineHeight
    } else {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(12)
      const paragraph = doc.splitTextToSize(line, pageContentWidth)
      doc.text(paragraph, margin, y)
      y += paragraph.length * lineHeight
    }
  })

  const now = new Date()
  const formattedDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("")
  const sequence = String(downloadSequence).padStart(2, "0")
  downloadSequence += 1
  const fileName = `${formattedDate}_${sequence}_${persona}.pdf`

  const pdfBlob = doc.output("blob")

  const formData = new FormData()
  formData.append("persona", persona)
  formData.append("durationSeconds", String(Math.round(durationSeconds)))
  formData.append("fileName", fileName)
  formData.append("file", pdfBlob, fileName)

  void fetch("/api/reports", {
    method: "POST",
    body: formData,
  }).catch(error => {
    console.error("Erreur lors de l'enregistrement du rapport", error)
  })

  doc.save(fileName)
}

export default function Controls({
  onClear,
  messages,
  summary,
  persona,
  durationSeconds,
}: Props) {
  // 📥 Génère un PDF contenant l'historique et la synthèse finale.
  const handleDownload = () => {
    if (!summary || messages.length === 0 || durationSeconds == null) return
    downloadConversationPdf({
      messages,
      summary,
      persona,
      durationSeconds,
    })
  }

  return (
    <div className="flex gap-3 justify-center">
      {/* 🔁 Permet de relancer un nouvel entretien immédiatement. */}
      <button
        onClick={onClear}
        className="rounded-2xl bg-gray-300 px-4 py-2 text-gray-800 shadow hover:bg-gray-400"
      >
        Effacer la conversation
      </button>
      {summary && messages.length > 0 && (
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
