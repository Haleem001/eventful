import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import type { Role } from "../lib/types";

export default function AuthPage() {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname !== "/auth/signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("EVENTEE");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError("");
  }, [location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const u = await login(email, password);
        toast("Signed in successfully", "success");
        navigate(u.role === "CREATOR" ? "/dashboard" : "/explore");
        return;
      }
      await register(email, password, role, name || undefined);
      toast("Account created! Check your email to verify.", "success");
      navigate("/auth/login");
      return;
    } catch (err: any) {
      const display = err.friendlyMessage;
      setError(display);
      toast(display, "error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center px-container-margin">
      <div className="w-full max-w-sm">
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-surface-container/60 flex items-center justify-center text-on-surface hover:opacity-80 transition-opacity active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-3xl">local_activity</span>
            <span className="font-headline-lg text-headline-md font-black text-primary">Eventful</span>
          </div>
          <p className="font-body-md text-sm text-on-surface-variant">
            {isLogin ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/50 text-on-surface font-body-md text-body-md rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/50 text-on-surface font-body-md text-body-md rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="Min 8 characters"
              minLength={8}
              required
            />
            {isLogin && (
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="font-label-sm text-label-sm text-primary hover:underline mt-1.5 ml-1"
              >
                Forgot password?
              </button>
            )}
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block ml-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/50 text-on-surface font-body-md text-body-md rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="Your full name"
                />
              </div>
              <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block ml-1">I am a</label>
              <div className="flex gap-2">
                {(["EVENTEE", "CREATOR"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-3 rounded-xl font-body-md text-body-md font-semibold transition-all active:scale-95 ${
                      role === r
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:border-primary/50"
                    }`}
                  >
                    {r === "EVENTEE" ? "Attendee" : "Creator"}
                  </button>
                ))}
              </div>
            </div>
            </>
          )}

          {error && (
            <p className={`font-body-md text-sm text-center ${error.includes("successful") ? "text-primary" : "text-error"}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container text-on-primary-container font-body-md text-body-md font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            style={{ boxShadow: loading ? "none" : "0 0 20px rgba(16, 185, 129, 0.3)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin" />
                {isLogin ? "Signing in..." : "Creating account..."}
              </span>
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant/30" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-3 text-on-surface-variant font-body-md text-sm">or</span>
          </div>
        </div>

        <a
          href={`${import.meta.env.VITE_API_URL ?? "/api"}/auth/google`}
          className="w-full flex items-center justify-center gap-3 bg-surface-container border border-outline-variant/30 text-on-surface font-body-md text-body-md font-semibold py-3.5 rounded-xl hover:bg-surface-container-high transition-all active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.97-5.97z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </a>

        <p className="text-center mt-6 font-body-md text-sm text-on-surface-variant">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setError(""); navigate(isLogin ? "/auth/signup" : "/auth/login"); }}
            className="text-primary font-semibold hover:underline"
          >
            {isLogin ? "Register" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
