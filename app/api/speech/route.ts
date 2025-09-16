// 🔊 Route API qui convertit le texte des réponses en audio (text-to-speech).
import OpenAI from "openai"

export const runtime = "nodejs"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("OPENAI_API_KEY manquant côté serveur.", {
      status: 500,
    })
  }

  let text: string
  let voice = "alloy"
  // Ajustements prosodiques optionnels
  let rate = "1.0" // vitesse normale
  let pitch = "0%" // hauteur neutre
  let style: string | undefined

  try {
    const body = await req.json()
    text = (body.text || "").trim()
    if (body.voice) voice = String(body.voice)
    if (body.rate) rate = String(body.rate)
    if (body.pitch) pitch = String(body.pitch)
    if (body.style) style = String(body.style)
  } catch {
    return new Response("Corps de requête invalide (JSON).", { status: 400 })
  }

  if (!text) {
    return new Response("Texte à convertir manquant.", { status: 400 })
  }

  try {
    // 🎼 Construction d'un texte SSML pour moduler rythme, hauteur et style.
    let ssml = `<speak><prosody rate="${rate}" pitch="${pitch}">${text}</prosody></speak>`
    if (style) {
      ssml = `<speak><prosody rate="${rate}" pitch="${pitch}"><emphasis level="${style}">${text}</emphasis></prosody></speak>`
    }

    // 🗣️ Appel au modèle de synthèse vocale adapté aux voix expressives.
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: ssml,
    })

    const buffer = Buffer.from(await speech.arrayBuffer())

    // 🔁 Renvoi du buffer audio directement dans la réponse HTTP.
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
