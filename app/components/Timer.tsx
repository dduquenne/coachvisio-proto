"use client"

// ⏱️ Chronomètre d'entretien : fournit le temps restant et les actions de
// démarrage, pause, reprise et arrêt. L'interface finale est déléguée au
// composant parent via un render prop.
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"

export type TimerState = "idle" | "running" | "paused" | "finished"

type TimerRenderProps = {
  state: TimerState
  remainingSeconds: number
  formattedRemaining: string
  start: () => void
  pause: () => void
  stop: () => void
}

type Props = {
  onStateChange?: (state: TimerState) => void
  onStop?: (elapsedSeconds: number) => void
  children?: (props: TimerRenderProps) => ReactNode
}

const DURATION_MINUTES = 15
const DURATION_SECONDS = DURATION_MINUTES * 60

export default function Timer({ onStateChange, onStop, children }: Props) {
  const [remaining, setRemaining] = useState(DURATION_SECONDS)
  const [state, setState] = useState<TimerState>("idle")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimestampRef = useRef<number | null>(null)
  const remainingRef = useRef(remaining)
  const stateRef = useRef<TimerState>(state)

  useEffect(() => {
    remainingRef.current = remaining
  }, [remaining])

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

  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const stopInternal = useCallback(
    (completed: boolean) => {
      const currentState = stateRef.current
      if (currentState !== "running" && currentState !== "paused") return

      if (currentState === "running" && startTimestampRef.current != null) {
        const elapsed = Math.min(
          DURATION_SECONDS,
          Math.max(0, (Date.now() - startTimestampRef.current) / 1000),
        )
        const nextRemaining = Math.max(
          0,
          Math.ceil(DURATION_SECONDS - elapsed),
        )
        remainingRef.current = nextRemaining
        setRemaining(nextRemaining)
      }

      clearIntervalRef()
      startTimestampRef.current = null

      const elapsedSeconds = completed
        ? DURATION_SECONDS
        : DURATION_SECONDS - remainingRef.current

      if (completed) {
        remainingRef.current = 0
        setRemaining(0)
      }

      stateRef.current = "finished"
      setState("finished")
      onStop?.(
        Math.min(DURATION_SECONDS, Math.max(0, Math.round(elapsedSeconds))),
      )
    },
    [clearIntervalRef, onStop],
  )

  const start = useCallback(() => {
    if (stateRef.current === "running") return

    clearIntervalRef()

    if (stateRef.current === "idle" || stateRef.current === "finished") {
      remainingRef.current = DURATION_SECONDS
      setRemaining(DURATION_SECONDS)
    }

    const alreadyElapsed = DURATION_SECONDS - remainingRef.current
    startTimestampRef.current = Date.now() - alreadyElapsed * 1000
    stateRef.current = "running"
    setState("running")

    const update = () => {
      if (startTimestampRef.current == null) return

      const elapsedSeconds = Math.min(
        DURATION_SECONDS,
        Math.max(0, (Date.now() - startTimestampRef.current) / 1000),
      )
      const nextRemaining = Math.max(
        0,
        Math.ceil(DURATION_SECONDS - elapsedSeconds),
      )

      remainingRef.current = nextRemaining
      setRemaining(nextRemaining)

      if (nextRemaining === 0) {
        stopInternal(true)
      }
    }

    update()
    intervalRef.current = setInterval(update, 250)
  }, [clearIntervalRef, stopInternal])

  const pause = useCallback(() => {
    if (stateRef.current !== "running") return

    if (startTimestampRef.current != null) {
      const elapsedSeconds = Math.min(
        DURATION_SECONDS,
        Math.max(0, (Date.now() - startTimestampRef.current) / 1000),
      )
      const nextRemaining = Math.max(
        0,
        Math.ceil(DURATION_SECONDS - elapsedSeconds),
      )
      remainingRef.current = nextRemaining
      setRemaining(nextRemaining)
    }

    clearIntervalRef()
    startTimestampRef.current = null
    stateRef.current = "paused"
    setState("paused")
  }, [clearIntervalRef])

  const stop = useCallback(() => {
    if (stateRef.current === "idle" || stateRef.current === "finished") return
    stopInternal(false)
  }, [stopInternal])

  const formattedRemaining = useMemo(() => {
    const minutes = Math.floor(remaining / 60)
      .toString()
      .padStart(2, "0")
    const seconds = Math.floor(remaining % 60)
      .toString()
      .padStart(2, "0")
    return `${minutes}:${seconds}`
  }, [remaining])

  const content = children
    ? children({
        state,
        remainingSeconds: remaining,
        formattedRemaining,
        start,
        pause,
        stop,
      })
    : null

  return <>{content}</>
}

export { DURATION_MINUTES, DURATION_SECONDS }
