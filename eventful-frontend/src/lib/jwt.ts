export function decodeToken(token: string): { id: string; email: string; role: "CREATOR" | "EVENTEE"; name?: string } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.sub || !payload.role) return null;
    return { id: payload.sub, email: payload.email || "", role: payload.role, name: payload.name };
  } catch {
    return null;
  }
}
