"use client"

type Props = {
  value: string
  onChange: (val: string) => void
}

const personas = [
  { id: "manager", label: "Manager exigeant" },
  { id: "coach", label: "Coach bienveillant" },
  { id: "recadrage", label: "Recadrage direct" },
]

export default function PersonaSelect({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl shadow bg-gray-50">
      <h2 className="text-lg font-semibold">Choisir une persona</h2>
      <div className="flex gap-3">
        {personas.map(p => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`rounded-2xl px-4 py-2 shadow font-medium ${
              value === p.id
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600">
        Persona active : <span className="font-bold">{value}</span>
      </p>
    </div>
  )
}
