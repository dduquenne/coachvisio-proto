import PersonaSelect from "@/app/components/PersonaSelect"
import Timer from "@/app/components/Timer"
import MessageList from "@/app/components/MessageList"
import Composer from "@/app/components/Composer"
import Controls from "@/app/components/Controls"

export default function InterviewPage() {
  return (
    <main className="flex flex-col gap-4 max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Simulation d’entretien</h1>
      <PersonaSelect />
      <Timer />
      <MessageList />
      <Composer />
      <Controls />
    </main>
  )
}
