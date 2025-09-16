"use client"

// ⏳ Affiche le temps de session restant (60 minutes à partir de la connexion).
import { useEffect, useState } from "react"

const SESSION_DURATION_MS = 60 * 60 * 1000
const STORAGE_KEY = "coachvisio-login-timestamp"

const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`
}

export default function RemainingTime() {
  const [remainingMs, setRemainingMs] = useState(SESSION_DURATION_MS)

  useEffect(() => {
    if (typeof window === "undefined") return

    const now = Date.now()
    const stored = Number(window.localStorage.getItem(STORAGE_KEY))
    let loginTimestamp = Number.isFinite(stored) ? stored : now

    if (now - loginTimestamp >= SESSION_DURATION_MS || !Number.isFinite(stored)) {
      loginTimestamp = now
      window.localStorage.setItem(STORAGE_KEY, String(loginTimestamp))
    }

    let intervalId: number | null = null

    const updateRemaining = () => {
      const elapsed = Date.now() - loginTimestamp
      const remaining = Math.max(0, SESSION_DURATION_MS - elapsed)
      setRemainingMs(remaining)
      if (remaining === 0 && intervalId !== null) {
        window.clearInterval(intervalId)
        intervalId = null
      }
    }

    updateRemaining()
    intervalId = window.setInterval(updateRemaining, 1000)

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        const refreshed = Number(event.newValue)
        if (Number.isFinite(refreshed)) {
          loginTimestamp = refreshed
          updateRemaining()
        }
      }
    }

    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener("storage", handleStorage)
      if (intervalId !== null) {
        window.clearInterval(intervalId)
      }
    }
  }, [])

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white/80 px-3 py-2 text-sm font-medium text-blue-700 shadow-sm">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" aria-hidden="true" />
      <span>
        Temps restant session : <span className="font-semibold">{formatTime(remainingMs)}</span>
      </span>
    </div>
  )
}
