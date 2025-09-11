"use client"

type Props = {
  onClear: () => void
}

export default function Controls({ onClear }: Props) {
  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={onClear}
        className="rounded-2xl bg-gray-300 px-4 py-2 text-gray-800 shadow hover:bg-gray-400"
      >
        Effacer la conversation
      </button>
    </div>
  )
}
