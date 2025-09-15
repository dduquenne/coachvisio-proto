'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type MutableRefObject,
} from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

export interface AvatarHandle {
  attachAudioAnalyser(audio: HTMLAudioElement): Promise<void>
}

interface AvatarProps {
  /** multiplier applied to mouth-open intensity */
  gain?: number
}

function AvatarModel({
  mouthRef,
}: {
  mouthRef: MutableRefObject<THREE.Mesh | null>
}) {
  const gltf = useLoader(GLTFLoader, '/avatar.glb')

  useEffect(() => {
    gltf.scene.traverse(child => {
      const mesh = child as THREE.Mesh & {
        morphTargetDictionary?: Record<string, number>
      }
      if (mesh.morphTargetDictionary?.mouthOpen !== undefined) {
        mouthRef.current = mesh
      }
    })
  }, [gltf, mouthRef])

  return (
    <primitive
      object={gltf.scene}
      scale={[3, 3, 3]}
      position={[0, -2, 0]}
    />
  )
}

const VOICE_LOW_HZ = 80
const VOICE_HIGH_HZ = 1000
const NOISE_THRESHOLD = 0.05

const Avatar = forwardRef<AvatarHandle, AvatarProps>(({ gain = 3 }, ref) => {
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const bandRef = useRef<{ low: number; high: number } | null>(null)
  const mouthRef = useRef<THREE.Mesh | null>(null)
  const rafRef = useRef<number>()
  const ctxRef = useRef<AudioContext | null>(null)

  const animate = () => {
    if (
      analyserRef.current &&
      dataRef.current &&
      mouthRef.current &&
      mouthRef.current.morphTargetDictionary &&
      mouthRef.current.morphTargetInfluences &&
      bandRef.current
    ) {
      analyserRef.current.getByteFrequencyData(dataRef.current)
      const data = dataRef.current
      const { low, high } = bandRef.current
      let sum = 0
      for (let i = low; i <= high; i++) {
        sum += data[i]
      }
      const amplitude = sum / ((high - low + 1) * 255)
      const normalized =
        amplitude > NOISE_THRESHOLD
          ? (amplitude - NOISE_THRESHOLD) / (1 - NOISE_THRESHOLD)
          : 0
      const index = mouthRef.current.morphTargetDictionary.mouthOpen
      if (index !== undefined) {
        const target = THREE.MathUtils.clamp(normalized * gain, 0, 1)
        const current = mouthRef.current.morphTargetInfluences[index] ?? 0
        mouthRef.current.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          current,
          target,
          0.1,
        )
      }
    }
    rafRef.current = requestAnimationFrame(animate)
  }

  const stop = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = undefined
    }
    if (ctxRef.current) {
      void ctxRef.current.close()
    }
    analyserRef.current = null
    dataRef.current = null
    ctxRef.current = null
    bandRef.current = null
  }

  useEffect(() => {
    const onEnd = () => stop()
    window.addEventListener('assistant-speaking-end', onEnd)
    return () => {
      window.removeEventListener('assistant-speaking-end', onEnd)
      stop()
    }
  }, [])

  useImperativeHandle(ref, () => ({
    async attachAudioAnalyser(audio: HTMLAudioElement) {
      stop()
      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext: typeof AudioContext
        }).webkitAudioContext
      const ctx = new AudioCtx()
      ctxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      const source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(ctx.destination)
      await ctx.resume()
      animate()
      analyserRef.current = analyser
      dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      const binSize = ctx.sampleRate / analyser.fftSize
      bandRef.current = {
        low: Math.floor(VOICE_LOW_HZ / binSize),
        high: Math.min(
          analyser.frequencyBinCount - 1,
          Math.floor(VOICE_HIGH_HZ / binSize),
        ),
      }
    }
  }))

  return (
    <Canvas
      camera={{ position: [0, 0, 2.5], fov: 25 }}
      className="w-full h-full"
    >
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <AvatarModel mouthRef={mouthRef} />
    </Canvas>
  )
})
Avatar.displayName = 'Avatar'
export default Avatar
