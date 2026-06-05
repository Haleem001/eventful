import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import BottomNav from "../components/BottomNav";
import api from "../lib/api";

interface ProfileData {
  name?: string;
  email: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get<ProfileData>("/users/me")
      .then((res) => {
        setProfile(res.data);
        setName(res.data.name || "");
      })
      .catch(() => toast("Failed to load profile", "error"))
      .finally(() => setLoading(false));
  }, [user, toast]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/users/me", { name });
      toast("Profile updated", "success");
    } catch (err: any) {
      toast(err?.response?.data?.message || "Failed to update profile", "error");
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setChangingPassword(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      toast("Password changed", "success");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast(err?.response?.data?.message || "Failed to change password", "error");
    }
    setChangingPassword(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col">
        <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex items-center px-container-margin py-stack-sm h-16">
          <button onClick={() => navigate(-1)} className="text-on-surface-variant hover:opacity-80 transition-opacity p-2 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md-mobile font-black text-primary ml-2">Profile</h1>
        </header>
        <main className="flex-grow flex items-center justify-center pt-16">
          <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col relative overflow-x-hidden">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex items-center px-container-margin py-stack-sm h-16">
        <button onClick={() => navigate(-1)} className="text-on-surface-variant hover:opacity-80 transition-opacity p-2 rounded-full">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md-mobile font-black text-primary ml-2">Profile</h1>
      </header>

      <main className="flex-grow flex flex-col w-full max-w-md mx-auto px-container-margin pt-20 pb-32 z-10 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

        <div className="z-10 w-full bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm p-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-primary">person</span>
            </div>
            <div>
              <p className="font-body-lg text-body-lg text-on-surface font-semibold">{profile?.name || "No name set"}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{profile?.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block ml-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary font-body-md text-body-md"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block ml-1">Email</label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full bg-surface-variant/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface/60 font-body-md text-body-md cursor-not-allowed"
              />
              <p className="font-label-sm text-[11px] text-on-surface-variant/60 mt-1 ml-1">Email cannot be changed.</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-on-primary px-4 py-3 rounded-xl font-label-sm text-label-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" /> : "Save Changes"}
            </button>
          </form>
        </div>

        <div className="z-10 mt-6 w-full bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm p-5">
          <h2 className="font-body-lg text-body-lg text-on-surface font-semibold mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block ml-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary font-body-md text-body-md"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block ml-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary font-body-md text-body-md"
                placeholder="Enter new password (min 6 chars)"
              />
            </div>
            <button
              type="submit"
              disabled={changingPassword}
              className="w-full bg-primary text-on-primary px-4 py-3 rounded-xl font-label-sm text-label-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {changingPassword ? <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" /> : "Change Password"}
            </button>
          </form>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
