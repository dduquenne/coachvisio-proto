"use client"

import { useRef, useState, useEffect } from "react"
import type { Message } from "./MessageList"

type Props = {
  onSend: (msg: Message) => void
  onSilence: () => void
  disabled?: boolean
}

export default function Composer({ onSend, onSilence, disabled }: Props) {
  const [text, setText] = useState("")
  const [voiceMode, setVoiceMode] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)

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

  const handleSend = () => {
    if (!text.trim() || disabled) return
    onSend({
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    })
    setText("")
  }

  const resetSilenceTimer = () => {
    if (!voiceMode) return
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      onSilence()
      resetSilenceTimer()
    }, 10000)
  }

  const startVoiceMode = () => {
    if (voiceMode || disabled) return
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
    recognition.onerror = () => {
      setVoiceMode(false)
    }
    recognition.onend = () => {
      if (voiceMode) {
        recognition.start()
      } else {
        setVoiceMode(false)
      }
    }
    recognitionRef.current = recognition
    recognition.start()
    setVoiceMode(true)
    resetSilenceTimer()
  }

  const stopVoiceMode = () => {
    setVoiceMode(false)
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    recognitionRef.current?.stop()
  }

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
