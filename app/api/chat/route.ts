import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  const { persona, lastUserMessage } = await req.json()

  // Persona → prompt system
  const systemPrompts: Record<string, string> = {
    manager: "Tu es un manager exigeant, direct et orienté résultats. Réponds de façon concise et challengeante.",
    coach: "Tu es un coach bienveillant et encourageant. Pose des questions ouvertes et aide ton interlocuteur à explorer ses ressentis.",
    recadrage: "Tu es un manager qui recadre fermement. Reste direct, précis et ferme dans tes réponses.",
  }

  const systemPrompt = systemPrompts[persona] ?? systemPrompts.manager

  // Appel au modèle
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: lastUserMessage },
    ],
  })

  const reply = completion.choices[0]?.message?.content ?? "…"

  return new Response(JSON.stringify({ reply }), {
    headers: { "Content-Type": "application/json" },
  })
}
