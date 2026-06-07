import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import api from "../lib/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      toast(err.friendlyMessage, "error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center px-container-margin">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <button onClick={() => navigate("/auth")} className="flex items-center gap-1 text-primary hover:underline mb-4 mx-auto">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Sign In
          </button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-3xl">lock_reset</span>
            <span className="font-headline-lg text-headline-md font-black text-primary">Eventful</span>
          </div>
          <p className="font-body-md text-sm text-on-surface-variant">Reset your password</p>
        </div>

        {sent ? (
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-primary mb-4">mark_email_read</span>
            <p className="font-body-md text-body-md text-on-surface mb-2">Check your email</p>
            <p className="font-body-md text-sm text-on-surface-variant mb-6">
              If an account with that email exists, we've sent a password reset link.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="text-primary font-label-sm text-label-sm hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-container text-on-primary-container font-body-md text-body-md font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
