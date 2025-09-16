import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PERSONAS, isPersonaId } from "@/app/personas"

type PersonaPageProps = {
  params: { id: string }
}

export default function PersonaPage({ params }: PersonaPageProps) {
  const { id } = params

  if (!isPersonaId(id)) {
    notFound()
  }

  const persona = PERSONAS[id]

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <article className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-blue-50 shadow-inner">
            <Image
              src={persona.avatar}
              alt={`Avatar ${persona.label}`}
              width={96}
              height={96}
              className="h-full w-full object-cover"
              sizes="96px"
            />
          </span>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900">{persona.label}</h1>
            <p className="text-sm text-gray-600">{persona.role}</p>
          </div>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Objectif de la simulation</h2>
          <p className="whitespace-pre-line text-gray-700">{persona.scenario}</p>
        </section>

        <Link
          href={`/?persona=${id}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Démarrer la simulation
        </Link>
      </article>
    </main>
  )
}
