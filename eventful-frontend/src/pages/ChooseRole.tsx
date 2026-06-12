import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import api from "../lib/api";
import type { Role } from "../lib/types";

export default function ChooseRole() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("EVENTEE");
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.post("/auth/choose-role", { role });
      toast("Account set up!", "success");
      navigate(role === "CREATOR" ? "/dashboard" : "/explore", { replace: true });
    } catch (err: any) {
      toast(err.friendlyMessage, "error");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center overflow-y-auto py-8 px-container-margin">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary text-3xl">local_activity</span>
          <span className="font-headline-lg text-headline-md font-black text-primary">Eventful</span>
        </div>
        <p className="font-body-md text-sm text-on-surface-variant mb-8">Welcome! What best describes you?</p>

        <div className="flex flex-col gap-4">
          {(["EVENTEE", "CREATOR"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                role === r
                  ? "border-primary bg-primary-container/50"
                  : "border-outline-variant/30 bg-surface-container hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  role === r ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant"
                }`}>
                  <span className="material-symbols-outlined">
                    {r === "EVENTEE" ? "confirmation_number" : "event"}
                  </span>
                </div>
                <div>
                  <p className="font-body-lg text-body-lg text-on-surface font-semibold">
                    {r === "EVENTEE" ? "Attendee" : "Creator"}
                  </p>
                  <p className="font-body-md text-sm text-on-surface-variant mt-0.5">
                    {r === "EVENTEE" ? "Browse and attend events" : "Host and manage events"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full mt-8 bg-primary text-on-primary font-body-md text-body-md font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          style={{ boxShadow: saving ? "none" : "0 0 20px rgba(16, 185, 129, 0.3)" }}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              Setting up...
            </span>
          ) : (
            "Continue"
          )}
        </button>

        <button
          onClick={() => { logout(); navigate("/auth/login"); }}
          className="mt-4 text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          Not now, sign in later
        </button>
      </div>
    </div>
  );
}
