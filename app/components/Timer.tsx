"use client"

// ⏱️ Chronomètre d'entretien : lance la session, calcule le temps réel écoulé
// et déclenche la synthèse finale lorsque la session se termine.
import { useCallback, useEffect, useRef, useState } from "react"

type TimerState = "idle" | "running" | "finished"

type Props = {
  onStateChange?: (state: TimerState) => void
  onStop?: (elapsedSeconds: number) => void
}

const DURATION_MINUTES = 10
const DURATION_SECONDS = DURATION_MINUTES * 60

export default function Timer({ onStateChange, onStop }: Props) {
  const [remaining, setRemaining] = useState(DURATION_SECONDS)
  const [state, setState] = useState<TimerState>("idle")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimestampRef = useRef<number | null>(null)
  const lastElapsedRef = useRef(0)
  const stateRef = useRef<TimerState>(state)

  useEffect(() => {
    stateRef.current = state
    onStateChange?.(state)
  }, [state, onStateChange])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const stopInternal = useCallback(
    (completed: boolean) => {
      if (stateRef.current !== "running") return

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      let elapsedSeconds: number
      if (completed) {
        elapsedSeconds = DURATION_SECONDS
      } else if (startTimestampRef.current != null) {
        elapsedSeconds = Math.min(
          DURATION_SECONDS,
          Math.max(0, (Date.now() - startTimestampRef.current) / 1000),
        )
      } else {
        elapsedSeconds = Math.min(DURATION_SECONDS, lastElapsedRef.current)
      }

      const remainingAfterStop = completed
        ? 0
        : Math.max(0, Math.ceil(DURATION_SECONDS - elapsedSeconds))

      lastElapsedRef.current = elapsedSeconds
      startTimestampRef.current = null

      setRemaining(remainingAfterStop)
      stateRef.current = "finished"
      setState("finished")
      onStop?.(elapsedSeconds)
    },
    [onStop],
  )

  const start = useCallback(() => {
    if (stateRef.current === "running") return

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    startTimestampRef.current = Date.now()
    lastElapsedRef.current = 0
    setRemaining(DURATION_SECONDS)
    stateRef.current = "running"
    setState("running")

    const update = () => {
      if (startTimestampRef.current == null) return

      const elapsedSeconds = Math.min(
        DURATION_SECONDS,
        Math.max(0, (Date.now() - startTimestampRef.current) / 1000),
      )
      lastElapsedRef.current = elapsedSeconds

      const nextRemaining = Math.max(
        0,
        Math.ceil(DURATION_SECONDS - elapsedSeconds),
      )

      setRemaining(nextRemaining)

      if (nextRemaining === 0) {
        stopInternal(true)
      }
    }

    update()
    intervalRef.current = setInterval(update, 250)
  }, [stopInternal])

  const stop = useCallback(() => {
    stopInternal(false)
  }, [stopInternal])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    startTimestampRef.current = null
    lastElapsedRef.current = 0
    stateRef.current = "idle"
    setState("idle")
    setRemaining(DURATION_SECONDS)
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0")
    return `${m}:${s}`
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 shadow">
      <div className="text-center text-sm text-gray-600">
        Durée fixe : {DURATION_MINUTES} minutes
      </div>

      <div className="text-center font-mono text-3xl">{formatTime(remaining)}</div>

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
