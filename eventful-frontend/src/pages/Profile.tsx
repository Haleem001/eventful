import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import BottomNav from "../components/BottomNav";
import api from "../lib/api";
import { SkeletonProfile } from "../components/Skeleton";

interface ProfileData {
  name?: string;
  email: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    api.get<ProfileData>("/users/me")
      .then((res) => {
        setProfile(res.data);
        setName(res.data.name || "");
      })
      .catch((err) => toast(err.friendlyMessage, "error"))
      .finally(() => setLoading(false));
  }, [user, toast]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/users/me", { name });
      toast("Profile updated", "success");
    } catch (err: any) {
      toast(err.friendlyMessage, "error");
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
      toast(err.friendlyMessage, "error");
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
        <main className="flex-grow pt-16">
          <SkeletonProfile />
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

        <div ref={deleteRef} className="z-10 mt-6 w-full">
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full text-error font-body-md text-body-md py-3 rounded-xl border border-error/30 hover:bg-error/10 transition-all"
          >
            Delete Account
          </button>
        </div>
      </main>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(11, 19, 38, 0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => { if (!deleting) setConfirmDelete(false); }}
        >
          <div
            className="w-full max-w-sm bg-surface-container rounded-2xl border border-outline-variant/20 p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="material-symbols-outlined text-5xl text-error mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
            <h2 className="font-headline-md text-headline-md-mobile text-on-surface mb-2">Delete account?</h2>
            <p className="font-body-md text-sm text-on-surface-variant mb-6">
              This will permanently deactivate your account. Your events and tickets will be preserved but you won't be able to sign in again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 border border-outline-variant/50 text-on-surface py-2.5 rounded-xl font-label-sm text-label-sm hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await api.delete("/auth/account");
                    logout();
                    navigate("/");
                    toast("Account deleted.", "success");
                  } catch (err: any) {
                    toast(err.friendlyMessage, "error");
                    setDeleting(false);
                    setConfirmDelete(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 bg-error text-on-error py-2.5 rounded-xl font-label-sm text-label-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <span className="w-4 h-4 border-2 border-on-error border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
