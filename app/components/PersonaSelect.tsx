"use client"

// 🎭 Permet de choisir la persona avec laquelle interagir.
import Image from "next/image"
import Link from "next/link"
import RemainingTime from "@/app/components/RemainingTime"
import { PERSONAS, PersonaId } from "@/app/personas"

type Props = {
  value: PersonaId
  onChange: (val: PersonaId) => void
}

export default function PersonaSelect({ value, onChange }: Props) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl bg-gray-50 p-6 shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Choisir une persona</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <RemainingTime />
          <Link
            href="/reports"
            className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
          >
            Historique
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Boucle sur toutes les personas déclarées pour proposer des cartes */}
        {Object.entries(PERSONAS).map(([id, p]) => {
          const isActive = value === id
          return (
            <button
              type="button"
              key={id}
              onClick={() => onChange(id as PersonaId)}
              aria-pressed={isActive}
              className={`group relative flex w-full items-center gap-4 rounded-2xl border bg-white/90 p-4 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                isActive
                  ? "border-blue-500 bg-white shadow-md ring-2 ring-blue-200"
                  : "border-transparent hover:border-blue-200 hover:bg-white"
              }`}
            >
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/60 bg-blue-50 shadow-inner">
                <Image
                  src={p.avatar}
                  alt={`Avatar ${p.label}`}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  sizes="64px"
                />
              </span>
              <span className="flex flex-col">
                <span className="text-base font-semibold text-gray-900">{p.label}</span>
                <span className="text-sm text-gray-600">{p.role}</span>
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-sm text-gray-600">
        Persona active :{" "}
        <span className="font-semibold text-gray-900">{PERSONAS[value].label}</span>
        <span className="text-gray-400"> · {PERSONAS[value].role}</span>
      </p>
    </section>
  )
}
