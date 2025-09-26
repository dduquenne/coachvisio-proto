"use client"

import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"

const markdownComponents: Components = {
  h1: ({ ...props }) => (
    <h1 className="text-2xl font-bold text-green-800 mb-4 border-b pb-2" {...props} />
  ),
  h2: ({ ...props }) => (
    <h2 className="text-xl font-semibold text-green-700 mt-4 mb-2" {...props} />
  ),
  ul: ({ ...props }) => <ul className="list-disc list-inside space-y-1" {...props} />,
  li: ({ ...props }) => <li className="leading-snug" {...props} />,
  p: ({ ...props }) => <p className="my-1 leading-relaxed" {...props} />,
}

type SummaryModalProps = {
  summary: string
  onListen: () => void
  onDownload: () => void
  onClose: () => void
}

export default function SummaryModal({
  summary,
  onListen,
  onDownload,
  onClose,
}: SummaryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-green-300 bg-green-50 p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 transition hover:bg-green-200"
          aria-label="Fermer la synthèse"
        >
          Fermer
        </button>
        <div className="flex flex-col gap-4 pr-2">
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <ReactMarkdown components={markdownComponents}>{summary}</ReactMarkdown>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onListen}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-white shadow hover:bg-emerald-700"
            >
              Écouter la synthèse
            </button>
            <button
              onClick={onDownload}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
            >
              Télécharger le PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
