import { NextRequest, NextResponse } from "next/server"

import { listReports, saveReport } from "@/app/lib/reports"
import { isPersonaId } from "@/app/personas"

export const GET = async () => {
  const reports = await listReports()
  return NextResponse.json({ reports })
}

export const POST = async (request: NextRequest) => {
  const formData = await request.formData()
  const persona = formData.get("persona")
  const durationValue = formData.get("durationSeconds")
  const file = formData.get("file")
  const providedFileName = formData.get("fileName")

  if (typeof persona !== "string" || !isPersonaId(persona)) {
    return NextResponse.json({ error: "Persona invalide" }, { status: 400 })
  }

  const durationSeconds = Number(durationValue)
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return NextResponse.json(
      { error: "Durée invalide" },
      { status: 400 },
    )
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Fichier manquant" },
      { status: 400 },
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdfBuffer = Buffer.from(arrayBuffer)

  const fileName =
    typeof providedFileName === "string" && providedFileName.trim() !== ""
      ? providedFileName.trim()
      : file.name

  const report = await saveReport({
    persona,
    durationSeconds,
    fileName,
    pdfBuffer,
  })

  return NextResponse.json({ report }, { status: 201 })
}
