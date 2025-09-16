"use client"

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

const SESSION_DURATION_MS = 60 * 60 * 1000
const STORAGE_KEY = "coachvisio-session-remaining"

type SessionTimeContextValue = {
  remainingMs: number
  deductTime: (milliseconds: number) => void
  reset: () => void
}

const SessionTimeContext = createContext<SessionTimeContextValue | undefined>(
  undefined,
)

type SessionTimeProviderProps = {
  children: ReactNode
}

export function SessionTimeProvider({ children }: SessionTimeProviderProps) {
  const [remainingMs, setRemainingMs] = useState(SESSION_DURATION_MS)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      const parsed = Number(stored)
      if (Number.isFinite(parsed)) {
        setRemainingMs(
          Math.min(SESSION_DURATION_MS, Math.max(0, Math.round(parsed))),
        )
      }
    }

    setIsReady(true)

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue != null) {
        const parsed = Number(event.newValue)
        if (Number.isFinite(parsed)) {
          setRemainingMs(
            Math.min(SESSION_DURATION_MS, Math.max(0, Math.round(parsed))),
          )
        }
      }
    }

    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  useEffect(() => {
    if (!isReady || typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, String(remainingMs))
  }, [remainingMs, isReady])

  const deductTime = useCallback((milliseconds: number) => {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return

    const delta = Math.round(milliseconds)
    if (delta <= 0) return

    setRemainingMs(prev =>
      Math.max(0, Math.min(SESSION_DURATION_MS, prev - delta)),
    )
  }, [])

  const reset = useCallback(() => {
    setRemainingMs(SESSION_DURATION_MS)
  }, [])

  const value = useMemo(
    () => ({ remainingMs, deductTime, reset }),
    [remainingMs, deductTime, reset],
  )

  return (
    <SessionTimeContext.Provider value={value}>
      {children}
    </SessionTimeContext.Provider>
  )
}

export function useSessionTime() {
  const ctx = useContext(SessionTimeContext)
  if (!ctx) {
    throw new Error("useSessionTime must be used within a SessionTimeProvider")
  }
  return ctx
}

export { SESSION_DURATION_MS }
