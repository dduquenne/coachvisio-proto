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

  const animate = () => {
    if (
      analyserRef.current &&
      dataRef.current &&
      mouthRef.current &&
      mouthRef.current.morphTargetDictionary &&
      mouthRef.current.morphTargetInfluences
    ) {
      analyserRef.current.getByteTimeDomainData(dataRef.current)
      let sum = 0
      for (let i = 0; i < dataRef.current.length; i++) {
        sum += Math.abs(dataRef.current[i] - 128)
      }
      const amplitude = sum / dataRef.current.length / 128
      const index = mouthRef.current.morphTargetDictionary.mouthOpen
      if (index !== undefined) {
        mouthRef.current.morphTargetInfluences[index] = THREE.MathUtils.clamp(
          amplitude * 2,
          0,
          1,
        )
      }
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
      animate()
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