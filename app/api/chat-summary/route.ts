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
          content: `Analyse l’entretien qui vient de se terminer.  
Ta mission est de fournir un retour structuré en trois parties :  

*RAPPORT D'ANALYSE DE LA CONVERSATION*

1. **Forces** : les points positifs observés dans la communication de l’utilisateur (ex. clarté, assertivité, empathie).  
2. **Vigilances** : les éléments à surveiller qui pourraient limiter son efficacité (ex. langage corporel implicite, hésitations, agressivité perçue).  
3. **Axes d’amélioration** : conseils concrets pour progresser lors des prochains entretiens (ex. poser plus de questions ouvertes, reformuler, garder le cap face aux objections).  

⚠️ Contraintes :  
- Rédige de façon professionnelle mais bienveillante.
- Prendre en compte les informations sur la persona utilisée (manager exigeant, coach bienveillant, recadrage direct) dans ta synthèse.
- Pas de jargon inutile.
- S'adresser directement à l'utilisateur.
- Maximum 200 mots.  
`,
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
