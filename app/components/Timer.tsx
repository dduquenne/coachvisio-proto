"use client"

import { useEffect, useState, useRef } from "react"

export default function Timer() {
  const [duration, setDuration] = useState(5) // durée initiale en minutes
  const [remaining, setRemaining] = useState(duration * 60) // en secondes
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Formater mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = Math.floor(seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  // Quand on clique sur Start
  const start = () => {
    if (running) return
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Quand on clique sur Stop
  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
  }

  // Reset timer à la durée choisie
  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRemaining(duration * 60)
    setRunning(false)
  }

  // Si la durée change, remettre le compteur
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
          disabled={running}
          className="rounded-2xl bg-green-500 px-4 py-2 text-white shadow disabled:opacity-50"
        >
          Start
        </button>
        <button
          onClick={stop}
          disabled={!running}
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
