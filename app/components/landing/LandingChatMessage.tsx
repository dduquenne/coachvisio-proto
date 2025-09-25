import { ReactNode } from "react"

type LandingChatMessageProps = {
  author: string
  children: ReactNode
  align?: "left" | "right"
}

export default function LandingChatMessage({ author, children, align = "left" }: LandingChatMessageProps) {
  const alignment = align === "left" ? "items-start" : "items-end"
  const bubbleColor = align === "left" ? "bg-white text-slate-900" : "bg-cyan-500 text-slate-950"

  return (
    <div className={`flex w-full flex-col gap-1 ${alignment}`}>
      <span className="text-xs font-medium text-white/60">{author}</span>
      <div
        className={`max-w-xs rounded-2xl px-4 py-3 text-sm shadow-lg shadow-slate-900/30 ${bubbleColor}`}
      >
        {children}
      </div>
    </div>
  )
}
