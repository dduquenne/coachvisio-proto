import { areCredentialsValid, SESSION_COOKIE_NAME } from "@/app/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const identifiant = formData.get("identifiant")
  const motDePasse = formData.get("motdepasse")

  if (areCredentialsValid(identifiant, motDePasse)) {
    const response = NextResponse.redirect(new URL("/", request.url), { status: 303 })
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "active",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    })
    return response
  }

  const redirectUrl = new URL("/login", request.url)
  redirectUrl.searchParams.set("error", "1")
  return NextResponse.redirect(redirectUrl, { status: 303 })
}
