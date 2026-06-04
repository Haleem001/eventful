import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import api from "../lib/api";
import { decodeToken } from "../lib/jwt";
import type { User, AuthResponse, Role } from "../lib/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, role?: Role) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function userFromToken(token: string): User | null {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return { id: decoded.id, email: decoded.email, role: decoded.role, createdAt: "" };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const u = userFromToken(token);
      if (u) {
        setUser(u);
      } else {
        localStorage.removeItem("accessToken");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    const u = userFromToken(data.accessToken)!;
    setUser(u);
    return u;
  };

  const register = async (email: string, password: string, role?: Role) => {
    const { data } = await api.post<User>("/auth/register", { email, password, role });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
