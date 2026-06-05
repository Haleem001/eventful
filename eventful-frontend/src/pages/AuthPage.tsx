import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import type { Role } from "../lib/types";

export default function AuthPage() {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("EVENTEE");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setIsLogin(true);
      setLoading(false);
      return;
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const display = Array.isArray(msg) ? msg[0] : msg || "Something went wrong";
      setError(display);
      toast(display, "error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center px-container-margin">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-3xl">location_on</span>
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

        <p className="text-center mt-6 font-body-md text-sm text-on-surface-variant">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            className="text-primary font-semibold hover:underline"
          >
            {isLogin ? "Register" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
