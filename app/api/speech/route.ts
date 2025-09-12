import OpenAI from "openai"

export const runtime = "nodejs"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("OPENAI_API_KEY manquant côté serveur.", { status: 500 })
  }

  let text: string
  try {
    const body = await req.json()
    text = (body.text || "").trim()
  } catch {
    return new Response("Corps de requête invalide (JSON).", { status: 400 })
  }

  if (!text) {
    return new Response("Texte à convertir manquant.", { status: 400 })
  }

  try {
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
    })

    const buffer = Buffer.from(await speech.arrayBuffer())

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Échec de synthèse."
    return new Response(`Erreur côté modèle: ${msg}`, { status: 500 })
  }
}
