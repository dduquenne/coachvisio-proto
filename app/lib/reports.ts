import { promises as fs } from "fs"
import path from "path"

import { PersonaId, isPersonaId } from "@/app/personas"

const REPORTS_DIR = path.join(process.cwd(), "data", "reports")
const METADATA_FILE = path.join(REPORTS_DIR, "metadata.json")

export type ReportRecord = {
  id: string
  createdAt: string
  persona: PersonaId
  durationSeconds: number
  fileName: string
}

const ensureStorageReady = async () => {
  await fs.mkdir(REPORTS_DIR, { recursive: true })
  try {
    await fs.access(METADATA_FILE)
  } catch {
    await fs.writeFile(METADATA_FILE, "[]", "utf8")
  }
}

const readMetadata = async (): Promise<ReportRecord[]> => {
  await ensureStorageReady()
  const raw = await fs.readFile(METADATA_FILE, "utf8")
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is ReportRecord => {
        if (typeof item !== "object" || item === null) return false
        const record = item as Partial<ReportRecord>
        return (
          typeof record.id === "string" &&
          typeof record.createdAt === "string" &&
          typeof record.fileName === "string" &&
          typeof record.durationSeconds === "number" &&
          isPersonaId((record as ReportRecord).persona)
        )
      })
    }
  } catch {
    // Ignore parsing errors and reset storage.
  }
  await fs.writeFile(METADATA_FILE, "[]", "utf8")
  return []
}

const writeMetadata = async (records: ReportRecord[]) => {
  await fs.writeFile(METADATA_FILE, JSON.stringify(records, null, 2), "utf8")
}

type SaveReportParams = {
  persona: PersonaId
  durationSeconds: number
  fileName: string
  pdfBuffer: Buffer
}

export const saveReport = async ({
  persona,
  durationSeconds,
  fileName,
  pdfBuffer,
}: SaveReportParams) => {
  await ensureStorageReady()
  const { randomUUID } = await import("crypto")
  const id = randomUUID()
  const createdAt = new Date().toISOString()
  const filePath = path.join(REPORTS_DIR, `${id}.pdf`)

  await fs.writeFile(filePath, pdfBuffer)

  const records = await readMetadata()
  records.push({ id, createdAt, persona, durationSeconds, fileName })
  await writeMetadata(records)

  return { id, createdAt, persona, durationSeconds, fileName }
}

export const listReports = async (): Promise<ReportRecord[]> => {
  const records = await readMetadata()
  return records.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

type ReportFile = {
  record: ReportRecord
  filePath: string
}

export const getReportFile = async (id: string): Promise<ReportFile | null> => {
  const records = await readMetadata()
  const record = records.find(item => item.id === id)
  if (!record) {
    return null
  }
  const filePath = path.join(REPORTS_DIR, `${record.id}.pdf`)
  try {
    await fs.access(filePath)
  } catch {
    return null
  }
  return { record, filePath }
}
