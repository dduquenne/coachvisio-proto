import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"

import InterviewPageClient from "@/app/components/InterviewPageClient"
import { SESSION_COOKIE_NAME } from "@/app/lib/auth"
import { isPersonaId } from "@/app/personas"

type SimulationPageProps = {
  params: { id: string }
}

export default async function SimulationPage({ params }: SimulationPageProps) {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE_NAME)
  if (!session) {
    redirect("/login")
  }

  const { id } = params
  if (!isPersonaId(id)) {
    notFound()
  }

  return <InterviewPageClient key={id} initialPersonaId={id} />
}
