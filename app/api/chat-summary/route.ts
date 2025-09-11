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

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `Tu es un évaluateur professionnel d'entretien simulé.
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
          content: JSON.stringify(transcript),
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
