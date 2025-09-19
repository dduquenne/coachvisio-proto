"use client"

// 📝 Zone de composition des messages utilisateur.
// Gère aussi le mode dictée vocale et la détection de silences prolongés.
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react"
import type { KeyboardEvent, PointerEvent } from "react"
import type { Message } from "./MessageList"

type Props = {
  onSend: (msg: Message) => void
  onSilence: () => void
  disabled?: boolean
}

export default function Composer({ onSend, onSilence, disabled }: Props) {
  const [text, setText] = useState("")
  const [voiceMode, setVoiceMode] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const voiceModeRef = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

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

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const stopAudioMeter = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    mediaStreamRef.current?.getTracks().forEach(track => track.stop())
    mediaStreamRef.current = null
    analyserRef.current = null
    dataArrayRef.current = null
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => null)
      audioContextRef.current = null
    }
    setAudioLevel(0)
  }, [])

  const startAudioMeter = useCallback(async () => {
    if (audioContextRef.current) return

    try {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error("Captation audio non supportée")
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const AudioContextClass =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext

      if (!AudioContextClass) {
        throw new Error("AudioContext non disponible")
      }

      const audioContext: AudioContext = new AudioContextClass()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser
      source.connect(analyser)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      dataArrayRef.current = dataArray

      const update = () => {
        if (!analyserRef.current || !dataArrayRef.current) return
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current)
        let sumSquares = 0
        for (let i = 0; i < dataArrayRef.current.length; i += 1) {
          const value = (dataArrayRef.current[i] - 128) / 128
          sumSquares += value * value
        }
        const rms = Math.sqrt(sumSquares / dataArrayRef.current.length)
        setAudioLevel(rms)
        animationFrameRef.current = requestAnimationFrame(update)
      }

      update()
    } catch (error) {
      stopAudioMeter()
      throw error
    }
  }, [stopAudioMeter])

  // 🎙️ Active l'écoute vocale tant que le bouton est maintenu.
  // ⏹️ Arrête proprement la dictée vocale et le timer de silence.
  const stopVoiceMode = useCallback(() => {
    if (!voiceModeRef.current) return
    voiceModeRef.current = false
    setVoiceMode(false)
    clearSilenceTimer()
    recognitionRef.current?.stop()
    recognitionRef.current = null
    stopAudioMeter()
  }, [clearSilenceTimer, stopAudioMeter])

  const startVoiceMode = useCallback(async () => {
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

    voiceModeRef.current = true
    setVoiceMode(true)

    try {
      await startAudioMeter()
    } catch {
      voiceModeRef.current = false
      setVoiceMode(false)
      alert(
        "Impossible d'accéder au microphone. Vérifiez les permissions du navigateur."
      )
      return
    }

    if (!voiceModeRef.current) {
      stopAudioMeter()
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
      if (event.error !== "no-speech") {
        stopVoiceMode()
      }
    }
    recognition.onend = () => {
      recognitionRef.current = null
      if (!voiceModeRef.current) {
        setVoiceMode(false)
        stopAudioMeter()
        clearSilenceTimer()
      }
    }
    recognitionRef.current = recognition

    try {
      recognition.start()
      resetSilenceTimer()
    } catch {
      stopVoiceMode()
    }
  }, [
    clearSilenceTimer,
    disabled,
    onSend,
    resetSilenceTimer,
    startAudioMeter,
    stopAudioMeter,
    stopVoiceMode,
  ])

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
        stopVoiceMode()
      }
    }
    window.addEventListener("assistant-speaking-start", handleSpeakingStart)
    return () => {
      window.removeEventListener("assistant-speaking-start", handleSpeakingStart)
    }
  }, [stopVoiceMode])

  useEffect(() => {
    return () => {
      stopVoiceMode()
    }
  }, [stopVoiceMode])

  const audioLevelWidth = useMemo(() => {
    if (!voiceMode) return "0%"
    const normalized = Math.min(1, audioLevel * 4)
    return `${Math.max(0.05, normalized) * 100}%`
  }, [audioLevel, voiceMode])

  const voiceButtonHandlers = {
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (disabled) return
      if (event.pointerType === "mouse" && event.button !== 0) return
      event.preventDefault()
      void startVoiceMode()
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => {
      if (disabled) return
      event.preventDefault()
      stopVoiceMode()
    },
    onPointerLeave: (event: PointerEvent<HTMLButtonElement>) => {
      if (disabled) return
      if (event.pointerType === "mouse") {
        stopVoiceMode()
      }
    },
    onPointerCancel: () => {
      if (disabled) return
      stopVoiceMode()
    },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault()
        void startVoiceMode()
      }
    },
    onKeyUp: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault()
        stopVoiceMode()
      }
    },
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div
        className={`flex items-center gap-3 rounded-full border bg-white px-4 py-3 shadow transition-opacity ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <button
          type="button"
          disabled={disabled}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
            voiceMode
              ? "bg-red-100 text-red-700"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
          {...voiceButtonHandlers}
        >
          {voiceMode ? "Enregistrement…" : "Maintenir pour parler"}
        </button>
        <div className="flex h-8 items-center">
          <div className="h-2 w-16 rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-red-500 transition-[width] duration-75 ease-out"
              style={{ width: audioLevelWidth }}
            />
          </div>
        </div>
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
          className="flex-1 border-none bg-transparent text-sm focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={disabled}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>

      {disabled && (
        <p className="flex items-center gap-1 text-sm text-red-600">
          ⏱️ Lancez le timer pour commencer l’entretien
        </p>
      )}
    </div>
  )
}
