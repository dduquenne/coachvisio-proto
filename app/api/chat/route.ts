// app/api/chat/route.ts
// 🚀 Route API responsable du streaming de réponses de la persona IA.
// Elle prépare les prompts contextuels et renvoie la sortie d'OpenAI en direct.
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
  // 🔐 Sécurité : on vérifie la présence de la clé avant toute requête.
  if (!process.env.OPENAI_API_KEY) {
    return new Response("OPENAI_API_KEY manquant côté serveur.", { status: 500 })
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return new Response("Corps de requête invalide (JSON).", { status: 400 })
  }

  // 🎭 Sélection de la persona et du message utilisateur à transmettre au modèle.
  const persona = (body.persona || "manager").toLowerCase() as PersonaId
  const lastUserMessage = (body.lastUserMessage || "").trim()
  const systemPrompt = PERSONAS[persona]?.prompt ?? PERSONAS.manager.prompt
  const rolePrompt = `Tu es une persona d’entretien simulé dans une session de formation.
Ton rôle : rester strictement dans le personnage défini (ex. Manager exigeant, Client difficile, Collaborateur en difficulté).
L’utilisateur joue son propre rôle et interagit avec toi comme dans une vraie situation professionnelle.

Règles :
- Ne donne jamais de feedback ou de conseils pendant la session.
- Maintiens un ton cohérent avec la persona choisie (exigeant, sceptique, démotivé, conflictuel, neutre).
- Tes réponses doivent être courtes (1 à 3 phrases maximum), pour garder le rythme oral.
- Utilise un langage naturel et réaliste, avec hésitations ou interjections si pertinent.
- Si l’utilisateur est silencieux ou hésite, relance-le avec une question ou une remarque adaptée au persona.
- N’annonce jamais que tu es une IA ni que c’est un exercice. Reste dans ton rôle jusqu’à la fin.

Format attendu en sortie :
- Uniquement le texte à prononcer, sans balises ni explications.`
  const privacyPrompt =
    "Ne fais aucune référence à des informations concernant le propriétaire du compte ChatGPT ou son identité. Réponds uniquement sur la base des messages fournis dans cette conversation."

  if (!lastUserMessage) {
    return new Response("Message utilisateur manquant.", { status: 400 })
  }

  try {
    // 🔄 Lancement du stream OpenAI (SDK v4)
    const stream = await client.chat.completions.stream({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: rolePrompt },
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

    // 📡 On convertit le flux OpenAI en ReadableStream natif pour le client.
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
