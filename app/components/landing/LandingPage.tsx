import LandingCTAButton from "./LandingCTAButton"
import LandingHeadline from "./LandingHeadline"
import LandingLoginLink from "./LandingLoginLink"
import LandingLogo from "./LandingLogo"
import LandingPreviewCard from "./LandingPreviewCard"

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#050b19] via-[#0b1832] to-[#040711]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(129,140,248,0.2),_transparent_55%)]" />

      <header className="relative z-10 flex items-center justify-between px-10 py-8">
        <LandingLogo />
        <LandingLoginLink />
      </header>

      <section className="relative z-10 flex flex-1 items-center justify-center px-6 pb-12 md:px-12">
        <div className="grid w-full max-w-6xl items-center gap-12 md:grid-cols-[minmax(0,_1fr)_minmax(0,_0.9fr)]">
          <div className="space-y-10 text-white">
            <LandingHeadline />
            <LandingCTAButton />
          </div>
          <LandingPreviewCard />
        </div>
      </section>
    </main>
  )
}
