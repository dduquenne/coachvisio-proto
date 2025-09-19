import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"

import { getReportFile } from "@/app/lib/reports"

export const GET = async (
  request: NextRequest,
  { params }: { params: { id: string } },
) => {
  const { id } = params
  const reportFile = await getReportFile(id)

  if (!reportFile) {
    return NextResponse.json({ error: "Rapport introuvable" }, { status: 404 })
  }

  const fileBuffer = await fs.readFile(reportFile.filePath)
  const dispositionType =
    request.nextUrl.searchParams.get("download") === "1"
      ? "attachment"
      : "inline"

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${dispositionType}; filename="${reportFile.record.fileName}"`,
      "Cache-Control": "no-store",
    },
  })
}
