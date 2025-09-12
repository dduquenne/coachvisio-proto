'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as THREE from 'three'

export interface AvatarHandle {
  attachAudioAnalyser(audio: HTMLAudioElement): void
}

function AvatarModel() {
  const gltf = useLoader(GLTFLoader, '/avatar.glb')
  return <primitive object={gltf.scene} />
}

const Avatar = forwardRef<AvatarHandle>((_props, ref) => {
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const mouthRef = useRef<THREE.Object3D | null>(null)
  const rafRef = useRef<number>()

  useEffect(() => {
    // store reference to first mesh as mouth
    const load = async () => {
      const loader = new GLTFLoader()
      const gltf = await loader.loadAsync('/avatar.glb')
      mouthRef.current = gltf.scene
    }
    load()
  }, [])

  const animate = () => {
    if (analyserRef.current && dataRef.current && mouthRef.current) {
      analyserRef.current.getByteTimeDomainData(dataRef.current)
      let sum = 0
      for (let i = 0; i < dataRef.current.length; i++) {
        sum += Math.abs(dataRef.current[i] - 128)
      }
      const amplitude = sum / dataRef.current.length / 128
      const scale = THREE.MathUtils.clamp(1 + amplitude, 1, 1.5)
      mouthRef.current.scale.y = scale
    }
    rafRef.current = requestAnimationFrame(animate)
  }

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
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
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      const source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(ctx.destination)
      analyserRef.current = analyser
      dataRef.current = new Uint8Array(analyser.fftSize)
      if (!mouthRef.current) {
        const loader = new GLTFLoader()
        loader.load('/avatar.glb', gltf => {
          mouthRef.current = gltf.scene
          animate()
        })
      } else {
        animate()
      }
    }
  }))

  return (
    <Canvas className="w-full h-full">
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <AvatarModel />
    </Canvas>
  )
})
Avatar.displayName = 'Avatar'
export default Avatar
