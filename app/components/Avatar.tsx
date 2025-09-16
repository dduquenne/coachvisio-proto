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
  /** amplitude threshold below which the mouth stays closed */
  noiseThreshold?: number
}

type MorphableMesh = THREE.Mesh & {
  morphTargetDictionary?: Record<string, number>
  morphTargetInfluences?: number[]
}

function AvatarModel({
  mouthMeshesRef,
}: {
  mouthMeshesRef: MutableRefObject<MorphableMesh[]>
}) {
  const gltf = useLoader(GLTFLoader, '/avatar.glb')

  useEffect(() => {
    mouthMeshesRef.current = []
    gltf.scene.traverse(child => {
      const mesh = child as MorphableMesh
      if (mesh.morphTargetDictionary?.mouthOpen !== undefined) {
        mouthMeshesRef.current.push(mesh)
      }
    })
  }, [gltf, mouthMeshesRef])

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
const DEFAULT_NOISE_THRESHOLD = 0.02

const Avatar = forwardRef<AvatarHandle, AvatarProps>((
  { gain = 3, noiseThreshold = DEFAULT_NOISE_THRESHOLD },
  ref,
) => {
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const bandRef = useRef<{ low: number; high: number } | null>(null)
  const mouthMeshesRef = useRef<MorphableMesh[]>([])
  const rafRef = useRef<number>()
  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef(gain)
  const noiseThresholdRef = useRef(noiseThreshold)

  useEffect(() => {
    gainRef.current = gain
  }, [gain])

  useEffect(() => {
    noiseThresholdRef.current = noiseThreshold
  }, [noiseThreshold])

  const animate = () => {
    if (
      analyserRef.current &&
      dataRef.current &&
      mouthMeshesRef.current.length > 0 &&
      bandRef.current
    ) {
      analyserRef.current.getByteFrequencyData(dataRef.current)
      const data = dataRef.current
      const { low, high } = bandRef.current
      let peak = 0
      for (let i = low; i <= high; i++) {
        const magnitude = data[i] / 255
        if (magnitude > peak) {
          peak = magnitude
        }
      }
      const amplitude = peak
      const threshold = noiseThresholdRef.current
      const normalized =
        amplitude > threshold
          ? (amplitude - threshold) / (1 - threshold)
          : 0
      const target = THREE.MathUtils.clamp(normalized * gainRef.current, 0, 1)
      mouthMeshesRef.current.forEach(mesh => {
        const dictionary = mesh.morphTargetDictionary
        const influences = mesh.morphTargetInfluences
        if (!dictionary || !influences) {
          return
        }
        const index = dictionary.mouthOpen
        if (index === undefined) {
          return
        }
        const current = influences[index] ?? 0
        influences[index] = THREE.MathUtils.lerp(current, target, 0.1)
      })
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
      <AvatarModel mouthMeshesRef={mouthMeshesRef} />
    </Canvas>
  )
})
Avatar.displayName = 'Avatar'
export default Avatar
