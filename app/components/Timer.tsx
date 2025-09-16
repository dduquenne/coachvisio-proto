"use client"

// ⏱️ Chronomètre d'entretien : lance la session et déclenche la synthèse finale.
import { useEffect, useState, useRef } from "react"

type Props = {
  onStateChange?: (state: "idle" | "running" | "finished") => void
}

export default function Timer({ onStateChange }: Props) {
  const [duration, setDuration] = useState(5) // minutes
  const [remaining, setRemaining] = useState(duration * 60) // secondes
  const [state, setState] = useState<"idle" | "running" | "finished">("idle")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 🔢 Convertit les secondes restantes en format mm:ss lisible.
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = Math.floor(seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  // ▶️ Lancement du décompte si le chrono n'est pas déjà en cours.
  const start = () => {
    if (state === "running") return
    setState("running")
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setState("finished") // fin du chrono
          setRemaining(0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // ⏸️ Met immédiatement fin à la session en cours.
  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setState("finished")
  }

  // 🔄 Réinitialise le timer pour une nouvelle tentative.
  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRemaining(duration * 60)
    setState("idle")
  }

  // Notifie le parent proprement à chaque changement d’état
  useEffect(() => {
    onStateChange?.(state)
  }, [state, onStateChange])

  // Quand on change la durée, on reset automatiquement
  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration])

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl shadow bg-gray-50">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Durée (minutes):</label>
        <input
          type="number"
          min={1}
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          className="w-16 rounded border px-2 py-1 text-center"
        />
      </div>

      <div className="text-3xl font-mono text-center">{formatTime(remaining)}</div>

      <div className="flex justify-center gap-2">
        <button
          onClick={start}
          disabled={state === "running"}
          className="rounded-2xl bg-green-500 px-4 py-2 text-white shadow disabled:opacity-50"
        >
          Start
        </button>
        <button
          onClick={stop}
          disabled={state !== "running"}
          className="rounded-2xl bg-red-500 px-4 py-2 text-white shadow disabled:opacity-50"
        >
          Stop
        </button>
        <button
          onClick={reset}
          className="rounded-2xl bg-gray-300 px-4 py-2 text-gray-800 shadow"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
