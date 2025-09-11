// app/api/chat-summary/route.ts
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
          content: `Tu es un évaluateur bienveillant d'entretien simulé. 
Fais une synthèse claire et structurée en français, au format suivant :

### Forces observées
- …

### Axes d’amélioration
- …

### Recommandations concrètes
- …`,
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
  } catch (err: any) {
    console.error("Erreur génération synthèse:", err)
    return new Response(
      JSON.stringify({ summary: "⚠️ Erreur côté serveur : " + err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
