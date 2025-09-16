"use client"

// ⏳ Affiche le temps de session restant géré par le contexte global.
import { useSessionTime } from "@/app/context/SessionTimeContext"

const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`
}

export default function RemainingTime() {
  const { remainingMs } = useSessionTime()

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white/80 px-3 py-2 text-sm font-medium text-blue-700 shadow-sm">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" aria-hidden="true" />
      <span>
        Temps restant session : <span className="font-semibold">{formatTime(remainingMs)}</span>
      </span>
    </div>
  )
}
