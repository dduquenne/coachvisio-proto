"use client"

import { useRef, useState, useEffect } from "react"
import type { Message } from "./MessageList"

type Props = {
  onSend: (msg: Message) => void
  disabled?: boolean
}

export default function Composer({ onSend, disabled }: Props) {
  const [text, setText] = useState("")
  const [recording, setRecording] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

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

  const startRecording = () => {
    if (recording || disabled) return
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
    recognition.interimResults = false
    recognition.onresult = e => {
      const transcript = e.results[0][0].transcript
      onSend({
        id: Date.now().toString(),
        role: "user",
        content: transcript,
      })
    }
    recognition.onerror = () => {
      setRecording(false)
    }
    recognition.onend = () => {
      setRecording(false)
    }
    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }

  const stopRecording = () => {
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
          onClick={recording ? stopRecording : startRecording}
          disabled={disabled}
          className="rounded-full bg-gray-200 p-2 text-gray-800 shadow disabled:opacity-50"
        >
          {recording ? "⏹️" : "🎤"}
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
