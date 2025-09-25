import LandingAvatar from "./LandingAvatar"
import LandingChatMessage from "./LandingChatMessage"
import LandingMicButton from "./LandingMicButton"

export default function LandingPreviewCard() {
  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl bg-slate-900/60 p-8 text-white shadow-2xl shadow-black/40 backdrop-blur-lg">
      <div className="absolute -top-10 -left-10 h-20 w-20 rounded-full bg-cyan-500/30 blur-3xl" />
      <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-indigo-500/20 blur-3xl" />
      <LandingAvatar />
      <div className="flex flex-col gap-4">
        <LandingChatMessage author="Coach AI">
          Bonjour, je suis Alex, votre coach pour aujourd&apos;hui. Prêt à commencer ?
        </LandingChatMessage>
        <LandingChatMessage author="Vous" align="right">
          Oui, je veux m&apos;entraîner pour mon prochain entretien.
        </LandingChatMessage>
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-slate-800/70 px-5 py-4">
        <div>
          <p className="text-sm font-semibold">Session en direct</p>
          <p className="text-xs text-white/60">Activez votre micro pour répondre</p>
        </div>
        <LandingMicButton />
      </div>
    </div>
  )
}
