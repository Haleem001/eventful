import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import BottomNav from "../components/BottomNav";
import api from "../lib/api";
import type { Reminder } from "../lib/types";

export default function Reminders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReminders = () => {
    setLoading(true);
    api.get<Reminder[]>("/reminders")
      .then((res) => setReminders(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast(err.friendlyMessage, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const handleDelete = (id: string) => {
    if (!window.confirm("Remove this reminder?")) return;
    api.delete(`/reminders/${id}`)
      .then(() => {
        toast("Reminder removed", "success");
        loadReminders();
      })
      .catch((err) => toast(err.friendlyMessage, "error"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col">
        <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex items-center px-container-margin py-stack-sm h-16">
          <button onClick={() => navigate(-1)} className="text-on-surface-variant hover:opacity-80 transition-opacity p-2 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md-mobile font-black text-primary ml-2">Reminders</h1>
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
        <h1 className="font-headline-md text-headline-md-mobile font-black text-primary ml-2">Reminders</h1>
      </header>

      <main className="flex-grow flex flex-col w-full max-w-md mx-auto px-container-margin pt-20 pb-32 z-10 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

        {reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">notifications_off</span>
            <p className="font-headline-md text-headline-md-mobile text-on-surface mb-2">No reminders</p>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-[260px]">
              Reminders for events you attend will appear here.
            </p>
          </div>
        ) : (
          <div className="z-10 space-y-3">
            {reminders.map((r) => (
              <div
                key={r.id}
                className="bg-surface-container rounded-2xl border border-outline-variant/20 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-body-md text-on-surface font-semibold truncate">
                      {r.event?.title || "Event"}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                      {new Date(r.remindAt).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric", year: "numeric",
                        hour: "numeric", minute: "2-digit",
                      })}
                    </p>
                    {r.sent && (
                      <span className="inline-flex items-center gap-1 mt-2 font-label-sm text-[11px] text-primary">
                        <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                        Sent
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="shrink-0 p-2 rounded-lg hover:bg-error/20 text-error transition-colors"
                    title="Remove reminder"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
