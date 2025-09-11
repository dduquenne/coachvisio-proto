import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json()

    if (!Array.isArray(transcript)) {
      return new Response("Transcript invalide", { status: 400 })
    }

    if (!transcript.length) {
      return new Response(
        JSON.stringify({ summary: "⚠️ Aucune conversation fournie." }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    const userOnlyTranscript = transcript.filter(
      (msg: { role: string }) => msg.role === "user"
    )

    if (!userOnlyTranscript.length) {
      return new Response(
        JSON.stringify({ summary: "⚠️ Aucune intervention utilisateur à analyser." }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    const privacyPrompt =
      "Ne fais aucune référence à des informations concernant le propriétaire du compte ChatGPT ou son identité. Base ton analyse uniquement sur la transcription fournie."

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: privacyPrompt },
        {
          role: "system",
          content: `Tu es un évaluateur professionnel d'entretien simulé. Évalue uniquement la qualité des interventions de l'utilisateur face à l'assistant, sans juger les réponses de l'assistant.
Rédige un rapport clair et concis en français, au format Markdown, avec la structure suivante :

# Rapport de simulation d’entretien

## Forces observées
- …

## Axes d’amélioration
- …

## Recommandations concrètes
- …

Sois bienveillant, précis et orienté action.`,
        },
        {
          role: "user",
          content: JSON.stringify(userOnlyTranscript),
        },
      ],
    })

    const summary = completion.choices[0]?.message?.content

    if (!summary) {
      return new Response(
        JSON.stringify({ summary: "⚠️ Aucune synthèse produite." }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    console.error("Erreur génération synthèse:", err)
    const msg = err instanceof Error ? err.message : "Erreur inconnue"
    return new Response(
      JSON.stringify({ summary: "⚠️ Erreur côté serveur : " + msg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
