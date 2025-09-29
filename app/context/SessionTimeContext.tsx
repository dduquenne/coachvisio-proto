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

const SESSION_DURATION_MS = 15 * 60 * 1000
const STORAGE_KEY = "coachvisio-session-remaining"
const SESSION_STORAGE_KEY = "coachvisio-session-remaining-session"

const clampRemaining = (value: number) =>
  Math.min(SESSION_DURATION_MS, Math.max(0, Math.round(value)))

type SessionTimeContextValue = {
  remainingMs: number
  deductTime: (milliseconds: number) => void
  reset: () => void
  persistRemaining: (value?: number) => void
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

    const storedSession = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    const storedLocal = window.localStorage.getItem(STORAGE_KEY)
    const stored = storedSession ?? storedLocal

    if (stored !== null) {
      const parsed = Number(stored)
      if (Number.isFinite(parsed)) {
        const normalized = clampRemaining(parsed)
        setRemainingMs(normalized)
        window.sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          String(normalized),
        )
        window.localStorage.setItem(STORAGE_KEY, String(normalized))
      }
    }

    setIsReady(true)

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue != null) {
        const parsed = Number(event.newValue)
        if (Number.isFinite(parsed)) {
          const normalized = clampRemaining(parsed)
          setRemainingMs(normalized)
          window.sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            String(normalized),
          )
        }
      }
    }

    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  const persistRemaining = useCallback(
    (value?: number) => {
      if (typeof window === "undefined") return

      const target = value ?? remainingMs
      const normalized = clampRemaining(target)

      window.sessionStorage.setItem(SESSION_STORAGE_KEY, String(normalized))
      window.localStorage.setItem(STORAGE_KEY, String(normalized))
    },
    [remainingMs],
  )

  useEffect(() => {
    if (!isReady || typeof window === "undefined") return
    persistRemaining(remainingMs)
  }, [remainingMs, isReady, persistRemaining])

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
    () => ({ remainingMs, deductTime, reset, persistRemaining }),
    [remainingMs, deductTime, reset, persistRemaining],
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
