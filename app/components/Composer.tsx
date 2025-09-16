"use client"

// 📝 Zone de composition des messages utilisateur.
// Gère aussi le mode dictée vocale et la détection de silences prolongés.
import { useRef, useState, useEffect, useCallback } from "react"
import type { Message } from "./MessageList"

type Props = {
  onSend: (msg: Message) => void
  onSilence: () => void
  disabled?: boolean
}

export default function Composer({ onSend, onSilence, disabled }: Props) {
  const [text, setText] = useState("")
  const [voiceMode, setVoiceMode] = useState(false)
  const voiceModeRef = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const wasVoiceModeRef = useRef(false)

  // 🌐 Au montage, on teste la disponibilité de l'API Web Speech et on stocke
  // la classe de reconnaissance pour pouvoir l'instancier plus tard.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionClass =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).SpeechRecognition ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitSpeechRecognition

      if (SpeechRecognitionClass) {
        recognitionRef.current = new SpeechRecognitionClass()
      }
    }
  }, [])

  useEffect(() => {
    voiceModeRef.current = voiceMode
  }, [voiceMode])

  // ✉️ Envoi manuel d'un message textuel classique.
  const handleSend = () => {
    if (!text.trim() || disabled) return
    onSend({
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    })
    setText("")
  }

  // ⏱️ Relance automatique de l'IA après 10 secondes de silence en mode voix.
  const resetSilenceTimer = useCallback(() => {
    if (!voiceModeRef.current) return
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      onSilence()
      resetSilenceTimer()
    }, 10000)
  }, [onSilence])

  // 🎙️ Active le mode reconnaissance vocale continue.
  const startVoiceMode = useCallback(() => {
    if (voiceModeRef.current || disabled) return
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée par ce navigateur.")
      return
    }
    const recognition: SpeechRecognition = new SpeechRecognition()
    recognition.lang = "fr-FR"
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = e => {
      const result = e.results[e.results.length - 1]
      const transcript = result[0].transcript
      onSend({
        id: Date.now().toString(),
        role: "user",
        content: transcript,
      })
      resetSilenceTimer()
    }
    recognition.onerror = event => {
      if (event.error === "no-speech") {
        recognition.abort()
        resetSilenceTimer()
      } else {
        setVoiceMode(false)
      }
    }
    recognition.onend = () => {
      if (voiceModeRef.current) {
        recognition.start()
      } else {
        setVoiceMode(false)
      }
    }
    recognitionRef.current = recognition
    recognition.start()
    setVoiceMode(true)
    resetSilenceTimer()
  }, [disabled, onSend, resetSilenceTimer])

  // ⏹️ Arrête proprement la dictée vocale et le timer de silence.
  const stopVoiceMode = useCallback(() => {
    setVoiceMode(false)
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    recognitionRef.current?.stop()
  }, [])

  // Si l'utilisateur désactive l'envoi (timer arrêté), on coupe aussi la dictée.
  useEffect(() => {
    if (disabled && voiceModeRef.current) {
      stopVoiceMode()
    }
  }, [disabled, stopVoiceMode])

  // 🔄 Suspension automatique de la dictée quand l'avatar parle pour éviter
  // que la voix synthétique soit reconnue comme une entrée utilisateur.
  useEffect(() => {
    const handleSpeakingStart = () => {
      if (voiceModeRef.current) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        wasVoiceModeRef.current = true
        recognitionRef.current?.stop()
        setVoiceMode(false)
      }
    }
    const handleSpeakingEnd = () => {
      if (wasVoiceModeRef.current) {
        wasVoiceModeRef.current = false
        startVoiceMode()
      }
    }
    window.addEventListener("assistant-speaking-start", handleSpeakingStart)
    window.addEventListener("assistant-speaking-end", handleSpeakingEnd)
    return () => {
      window.removeEventListener("assistant-speaking-start", handleSpeakingStart)
      window.removeEventListener("assistant-speaking-end", handleSpeakingEnd)
    }
  }, [startVoiceMode])

  return (
    <div className="flex flex-col gap-2 p-3 rounded-2xl shadow bg-gray-50">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={
            disabled ? "⏱️ Lancez le timer pour commencer" : "Écrire un message..."
          }
          disabled={disabled}
          className="flex-1 rounded border px-3 py-2 disabled:bg-gray-100"
        />
        <button
          onClick={voiceMode ? stopVoiceMode : startVoiceMode}
          disabled={disabled}
          className={`rounded-full p-2 text-gray-800 shadow disabled:opacity-50 ${
            voiceMode ? "bg-red-200" : "bg-gray-200"
          }`}
        >
          {voiceMode ? "⏹️" : "🎤"}
        </button>
        <button
          onClick={handleSend}
          disabled={disabled}
          className="rounded-2xl bg-blue-600 px-4 py-2 text-white shadow disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>

      {disabled && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          ⏱️ Lancez le timer pour commencer l’entretien
        </p>
      )}
    </div>
  )
}
