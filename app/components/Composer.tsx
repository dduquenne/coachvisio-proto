"use client"

// 📝 Zone de composition des messages utilisateur avec bascule vocale
// persistante inspirée de la charte graphique de la landing page.
import { useCallback, useEffect, useRef, useState } from "react"
import { Mic, MicOff, SendHorizontal } from "lucide-react"

import type { Message } from "./MessageList"

type Props = {
  onSend: (msg: Message) => void
  onSilence: () => void
  disabled?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any

type RecognitionResultEvent = {
  results: ArrayLike<{
    0: { transcript: string }
  }>
}

type RecognitionErrorEvent = {
  error: string
}

export default function Composer({ onSend, onSilence, disabled }: Props) {
  const [text, setText] = useState("")
  const [voiceMode, setVoiceMode] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const voiceModeRef = useRef(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const manualStopRef = useRef(false)
  const suspendedRef = useRef(false)

  useEffect(() => {
    voiceModeRef.current = voiceMode
  }, [voiceMode])

  const handleSend = useCallback(() => {
    if (!text.trim() || disabled) return
    onSend({
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    })
    setText("")
  }, [disabled, onSend, text])

  const resetSilenceTimer = useCallback(() => {
    if (!voiceModeRef.current) return
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      onSilence()
      resetSilenceTimer()
    }, 10000)
  }, [onSilence])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const startRecognition = useCallback(() => {
    if (!voiceModeRef.current || recognitionRef.current) return
    if (typeof window === "undefined") return

    const SpeechRecognitionClass =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      alert("La reconnaissance vocale n'est pas supportée par ce navigateur.")
      voiceModeRef.current = false
      setVoiceMode(false)
      return
    }

    const recognition: SpeechRecognitionInstance = new SpeechRecognitionClass()
    recognition.lang = "fr-FR"
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      resetSilenceTimer()
    }

    recognition.onresult = (event: RecognitionResultEvent) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript
      onSend({
        id: Date.now().toString(),
        role: "user",
        content: transcript,
      })
      resetSilenceTimer()
    }

    recognition.onerror = (event: RecognitionErrorEvent) => {
      if (event.error === "no-speech") return
      manualStopRef.current = true
      voiceModeRef.current = false
      setVoiceMode(false)
      clearSilenceTimer()
      recognition.stop()
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setIsListening(false)

      if (manualStopRef.current) {
        manualStopRef.current = false
        clearSilenceTimer()
        return
      }

      if (suspendedRef.current) {
        return
      }

      if (voiceModeRef.current) {
        startRecognition()
      } else {
        clearSilenceTimer()
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      manualStopRef.current = true
      voiceModeRef.current = false
      setVoiceMode(false)
    }
  }, [clearSilenceTimer, onSend, resetSilenceTimer])

  const deactivateVoiceMode = useCallback(() => {
    if (!voiceModeRef.current) return
    voiceModeRef.current = false
    setVoiceMode(false)
    manualStopRef.current = true
    suspendedRef.current = false
    clearSilenceTimer()
    recognitionRef.current?.stop()
  }, [clearSilenceTimer])

  const activateVoiceMode = useCallback(() => {
    if (voiceModeRef.current || disabled) return
    voiceModeRef.current = true
    setVoiceMode(true)
    manualStopRef.current = false
    suspendedRef.current = false
    startRecognition()
  }, [disabled, startRecognition])

  useEffect(() => {
    if (disabled && voiceModeRef.current) {
      deactivateVoiceMode()
    }
  }, [deactivateVoiceMode, disabled])

  useEffect(() => {
    const handleSpeakingStart = () => {
      if (!voiceModeRef.current || !recognitionRef.current) return
      suspendedRef.current = true
      recognitionRef.current.stop()
    }

    const handleSpeakingEnd = () => {
      if (!voiceModeRef.current) return
      suspendedRef.current = false
      manualStopRef.current = false
      startRecognition()
    }

    window.addEventListener("assistant-speaking-start", handleSpeakingStart)
    window.addEventListener("assistant-speaking-end", handleSpeakingEnd)

    return () => {
      window.removeEventListener("assistant-speaking-start", handleSpeakingStart)
      window.removeEventListener("assistant-speaking-end", handleSpeakingEnd)
    }
  }, [startRecognition])

  useEffect(() => {
    return () => {
      voiceModeRef.current = false
      recognitionRef.current?.stop()
      clearSilenceTimer()
    }
  }, [clearSilenceTimer])

  return (
    <div className="space-y-3 rounded-3xl border border-white/15 bg-white/10 p-6 text-white shadow-2xl shadow-cyan-500/10 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <button
          type="button"
          onClick={voiceMode ? deactivateVoiceMode : activateVoiceMode}
          disabled={disabled}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-transparent ${
            voiceMode
              ? "bg-rose-500/90 text-white shadow-lg shadow-rose-500/40"
              : "bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {voiceMode ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {voiceMode
            ? isListening
              ? "Mode vocal actif"
              : "Mode vocal en pause"
            : "Activer le mode vocal"}
        </button>

        <div className="flex flex-1 items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 shadow-inner shadow-cyan-500/20">
          <input
            type="text"
            value={text}
            onChange={event => setText(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                handleSend()
              }
            }}
            placeholder={
              disabled
                ? "⏱️ Lancez la simulation pour commencer"
                : "Écrivez votre réponse..."
            }
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/40 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Envoyer
            <SendHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {voiceMode && (
        <p className="text-xs text-white/70">
          🎤 Le microphone reste actif tant que vous ne repassez pas en saisie texte.
        </p>
      )}

      {disabled && (
        <p className="flex items-center gap-1 text-sm font-medium text-rose-200">
          ⏱️ Lancez la simulation pour échanger avec l’avatar.
        </p>
      )}
    </div>
  )
}
