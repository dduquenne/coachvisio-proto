// app/api/chat/route.ts
import OpenAI from "openai"

export const runtime = "nodejs" // explicite : on reste côté Node

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type Body = {
  persona?: "manager" | "coach" | "recadrage" | string
  lastUserMessage?: string
}

const PERSONA_PROMPTS: Record<string, string> = {
  manager:
    "Tu es un manager exigeant, très factuel et orienté résultats. Tu vas droit au but, tu demandes des indicateurs, des échéances et des engagements. Style: concis, challengeant, professionnel. Une ou deux questions maximum par réponse.",
  coach:
    "Tu es un coach bienveillant. Tu reformules brièvement, tu poses des questions ouvertes, tu aides à clarifier les objectifs et les émotions. Style: empathique, constructif, 2 à 4 phrases courtes, une question de relance.",
  recadrage:
    "Tu es un manager qui recadre fermement. Tu es direct, précis, et demandes un engagement clair, des conséquences et un plan d'action immédiat. Style: assertif, sans agressivité, 2 à 3 phrases, termine par une exigence concrète.",
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("OPENAI_API_KEY manquant côté serveur.", { status: 500 })
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return new Response("Corps de requête invalide (JSON).", { status: 400 })
  }

  const persona = (body.persona || "manager").toLowerCase()
  const lastUserMessage = (body.lastUserMessage || "").trim()
  const systemPrompt = PERSONA_PROMPTS[persona] ?? PERSONA_PROMPTS.manager

  if (!lastUserMessage) {
    return new Response("Message utilisateur manquant.", { status: 400 })
  }

  try {
    // Lancement du stream OpenAI (SDK v4)
    const stream = await client.chat.completions.stream({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Contexte: entretien simulé chronométré.\n" +
            "Consignes: sois bref, utile, et pose au plus UNE question de relance pertinente.\n" +
            "Message de l'utilisateur: " +
            lastUserMessage,
        },
      ],
    })

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content
            if (delta) controller.enqueue(encoder.encode(delta))
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Échec de génération."
    return new Response(`Erreur côté modèle: ${msg}`, { status: 500 })
  }  
}
