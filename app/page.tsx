import InterviewPageClient from "@/app/components/InterviewPageClient"
import { SESSION_COOKIE_NAME } from "@/app/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default function InterviewPage() {
  const session = cookies().get(SESSION_COOKIE_NAME)

  if (!session) {
    redirect("/login")
  }

  return <InterviewPageClient />
}
