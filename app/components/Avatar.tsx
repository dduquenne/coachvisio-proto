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
  attachAudioAnalyser(audio: HTMLAudioElement): void
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

const Avatar = forwardRef<AvatarHandle>((_props, ref) => {
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const mouthRef = useRef<THREE.Mesh | null>(null)
  const rafRef = useRef<number>()
  const ctxRef = useRef<AudioContext | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playHandlerRef = useRef<() => void>()

  const animate = () => {
    if (
      analyserRef.current &&
      dataRef.current &&
      mouthRef.current &&
      mouthRef.current.morphTargetDictionary &&
      mouthRef.current.morphTargetInfluences
    ) {
      analyserRef.current.getByteTimeDomainData(dataRef.current)
      const data = dataRef.current
      let sum = 0
      for (let i = 0; i < data.length; i++) {
        const value = data[i] - 128
        sum += value * value
      }
      const amplitude = Math.sqrt(sum / data.length) / 128
      const index = mouthRef.current.morphTargetDictionary.mouthOpen
      if (index !== undefined) {
        const target = THREE.MathUtils.clamp(amplitude * 3, 0, 1)
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
    if (audioRef.current && playHandlerRef.current) {
      audioRef.current.removeEventListener('play', playHandlerRef.current)
    }
    if (ctxRef.current) ctxRef.current.close()
    analyserRef.current = null
    dataRef.current = null
    ctxRef.current = null
    audioRef.current = null
    playHandlerRef.current = undefined
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
    attachAudioAnalyser(audio: HTMLAudioElement) {
      stop()
      const ctx = new AudioContext()
      ctxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      const source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(ctx.destination)
      const onPlay = () => {
        void ctx.resume()
        animate()
      }
      audio.addEventListener('play', onPlay)
      playHandlerRef.current = onPlay
      audioRef.current = audio
      analyserRef.current = analyser
      dataRef.current = new Uint8Array(analyser.fftSize)
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
