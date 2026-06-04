export function decodeToken(token: string): { id: string; email: string; role: "CREATOR" | "EVENTEE" } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.sub || !payload.role) return null;
    return { id: payload.sub, email: payload.email || "", role: payload.role };
  } catch {
    return null;
  }
}
