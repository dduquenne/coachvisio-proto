export const SESSION_COOKIE_NAME = "coachvisio-session"

export function areCredentialsValid(
  identifiant: FormDataEntryValue | null,
  motDePasse: FormDataEntryValue | null,
): boolean {
  return identifiant === "Test" && motDePasse === "Test"
}
