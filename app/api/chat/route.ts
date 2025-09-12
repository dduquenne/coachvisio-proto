// app/api/chat/route.ts
import OpenAI from "openai"
import { PERSONAS, PersonaId } from "@/app/personas"

export const runtime = "nodejs" // explicite : on reste côté Node

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type Body = {
  persona?: PersonaId | string
  lastUserMessage?: string
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

  const persona = (body.persona || "manager").toLowerCase() as PersonaId
  const lastUserMessage = (body.lastUserMessage || "").trim()
  const systemPrompt = PERSONAS[persona]?.prompt ?? PERSONAS.manager.prompt
  const privacyPrompt =
    "Ne fais aucune référence à des informations concernant le propriétaire du compte ChatGPT ou son identité. Réponds uniquement sur la base des messages fournis dans cette conversation."

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
        { role: "system", content: privacyPrompt },
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
