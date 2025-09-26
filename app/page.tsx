import LandingPage from "@/app/components/landing/LandingPage"
import DashboardClient from "@/app/components/dashboard/DashboardClient"
import { SESSION_COOKIE_NAME } from "@/app/lib/auth"
import { listReports } from "@/app/lib/reports"
import { cookies } from "next/headers"

export default async function HomePage() {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE_NAME)

  if (!session) {
    return <LandingPage />
  }

  const reports = await listReports()

  return <DashboardClient reports={reports} />
}
