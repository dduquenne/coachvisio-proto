import InterviewPageClient from "@/app/components/InterviewPageClient"
import LandingPage from "@/app/components/landing/LandingPage"
import { SESSION_COOKIE_NAME } from "@/app/lib/auth"
import { cookies } from "next/headers"

export default function HomePage() {
  const session = cookies().get(SESSION_COOKIE_NAME)

  if (!session) {
    return <LandingPage />
  }

  return <InterviewPageClient />
}
