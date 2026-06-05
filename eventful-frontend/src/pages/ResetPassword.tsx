import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import api from "../lib/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }
    if (newPassword.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      setDone(true);
      toast("Password reset successfully", "success");
    } catch (err: any) {
      toast(err?.response?.data?.message || "Invalid or expired token", "error");
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center px-container-margin">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-error mb-4">error_outline</span>
          <p className="font-body-md text-body-md text-on-surface mb-2">Invalid reset link</p>
          <p className="font-body-md text-sm text-on-surface-variant mb-6">No reset token found in the URL.</p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-primary font-label-sm text-label-sm hover:underline"
          >
            Request a new reset link
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center px-container-margin">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-primary mb-4">check_circle</span>
          <p className="font-headline-md text-headline-md-mobile text-on-surface mb-2">Password reset!</p>
          <p className="font-body-md text-sm text-on-surface-variant mb-6">Your password has been updated.</p>
          <button
            onClick={() => navigate("/auth")}
            className="bg-primary-container text-on-primary-container font-body-md text-body-md font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center px-container-margin">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-3xl">lock</span>
            <span className="font-headline-lg text-headline-md font-black text-primary">Eventful</span>
          </div>
          <p className="font-body-md text-sm text-on-surface-variant">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block ml-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/50 text-on-surface font-body-md text-body-md rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="Min 6 characters"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block ml-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/50 text-on-surface font-body-md text-body-md rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="Repeat password"
              minLength={6}
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
                Resetting...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
