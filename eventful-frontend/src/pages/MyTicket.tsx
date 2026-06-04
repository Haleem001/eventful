import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import BottomNav from "../components/BottomNav";
import api from "../lib/api";
import type { Ticket } from "../lib/types";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PAID: { label: "Paid", cls: "bg-primary/10 text-primary border border-primary/20" },
  PENDING: { label: "Pending", cls: "bg-warning/10 text-warning border border-warning/20" },
  CANCELLED: { label: "Cancelled", cls: "bg-error/10 text-error border border-error/20" },
};

export default function MyTicket() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const verifyingRef = useRef(false);

  const loadTickets = useCallback(() => {
    if (!user) return;
    setLoading(true);
    api.get<Ticket[]>("/tickets/user")
      .then((res) => setTickets(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast(err?.response?.data?.message || "Failed to load tickets", "error"))
      .finally(() => setLoading(false));
  }, [user, toast]);

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference || !user || verifyingRef.current) return;
    verifyingRef.current = true;
    api.post("/payments/verify", { reference })
      .then(() => {
        toast("Payment verified! Your ticket is ready.", "success");
        setSearchParams({});
        loadTickets();
      })
      .catch((err) => {
        toast(err?.response?.data?.message || "Payment verification failed", "error");
        setSearchParams({});
      })
      .finally(() => {
        verifyingRef.current = false;
      });
  }, [searchParams, user, toast, setSearchParams, loadTickets]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadTickets();
  }, [user, loadTickets]);

  if (!user) {
    return (
      <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col items-center justify-center gap-4 px-6">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">confirmation_number</span>
        <p className="font-body-md text-body-md text-on-surface-variant text-center">Sign in to see your tickets.</p>
        <button onClick={() => navigate("/auth")} className="bg-primary text-on-primary px-6 py-2 rounded-full">
          Sign In
        </button>
        <BottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col relative overflow-x-hidden">
        <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center px-container-margin py-stack-sm">
          <div className="w-10" />
          <h1 className="font-headline-md text-headline-md-mobile font-black text-primary">My Tickets</h1>
          <div className="w-10" />
        </header>
        <main className="flex-grow flex items-center justify-center pt-20">
          <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
        <BottomNav />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col relative overflow-x-hidden">
        <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center px-container-margin py-stack-sm">
          <div className="w-10" />
          <h1 className="font-headline-md text-headline-md-mobile font-black text-primary">My Tickets</h1>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((o) => !o)}
              className="text-on-surface-variant hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-10 z-50 bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl min-w-[180px] overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/20">
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setShowUserMenu(false); navigate("/"); }}
                    className="w-full flex items-center gap-2 px-4 py-3 font-body-md text-body-md text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex-grow flex flex-col items-center justify-center px-6 pt-20 pb-32">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">confirmation_number</span>
          <p className="font-headline-md text-headline-md-mobile text-on-surface mb-2">No tickets yet</p>
          <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-[260px] mb-6">
            Events you attend will appear here.
          </p>
          <button
            onClick={() => navigate("/explore")}
            className="bg-primary text-on-primary font-label-sm text-label-sm px-6 py-3 rounded-full hover:opacity-90 active:scale-95 transition-all"
          >
            Explore Events
          </button>
        </main>
        <BottomNav />
      </div>
    );
  }

  const activeTickets = tickets.filter((t) => t.status === "PAID" && !t.isScanned);
  const pastTickets = tickets.filter((t) => t.status !== "PAID" || t.isScanned);

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col relative overflow-x-hidden">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center px-container-margin py-stack-sm">
        <div className="w-10" />
        <h1 className="font-headline-md text-headline-md-mobile font-black text-primary">My Tickets</h1>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu((o) => !o)}
            className="text-on-surface-variant hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-10 z-50 bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl min-w-[180px] overflow-hidden">
                <div className="px-4 py-3 border-b border-outline-variant/20">
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { logout(); setShowUserMenu(false); navigate("/"); }}
                  className="w-full flex items-center gap-2 px-4 py-3 font-body-md text-body-md text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="flex-grow flex flex-col w-full max-w-md mx-auto px-container-margin pt-20 pb-32 z-10 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

        {activeTickets.length > 0 && (
          <section className="z-10 mb-8">
            <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Active ({activeTickets.length})
            </h2>
            <div className="space-y-3">
              {activeTickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/ticket/${t.id}`)}
                  className="w-full text-left bg-surface-container rounded-2xl border border-outline-variant/20 p-4 hover:bg-surface-container-high active:scale-[0.99] transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-body-md text-body-md text-on-surface font-semibold truncate">
                        {t.event?.title || "Event Ticket"}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 font-mono">
                        {t.reference.toUpperCase()}
                      </p>
                      <p className="font-label-sm text-[11px] text-on-surface-variant/60 mt-1">
                        {t.event?.date
                          ? new Date(t.event.date).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })
                          : "Date TBD"}
                      </p>
                    </div>
                    <span className={`shrink-0 px-3 py-1 rounded-full font-label-sm text-[11px] ${STATUS_BADGE[t.status]?.cls || "bg-surface-variant/50 text-on-surface-variant"}`}>
                      {STATUS_BADGE[t.status]?.label || t.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {pastTickets.length > 0 && (
          <section className="z-10">
            <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-4">
              Past ({pastTickets.length})
            </h2>
            <div className="space-y-3">
              {pastTickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/ticket/${t.id}`)}
                  className="w-full text-left bg-surface-container rounded-2xl border border-outline-variant/20 p-4 hover:bg-surface-container-high active:scale-[0.99] transition-all opacity-70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-body-md text-body-md text-on-surface font-semibold truncate">
                        {t.event?.title || "Event Ticket"}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 font-mono">
                        {t.reference.toUpperCase()}
                      </p>
                      <p className="font-label-sm text-[11px] text-on-surface-variant/60 mt-1">
                        {t.event?.date
                          ? new Date(t.event.date).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })
                          : "Date TBD"}
                      </p>
                    </div>
                    <span className={`shrink-0 px-3 py-1 rounded-full font-label-sm text-[11px] ${t.isScanned ? "bg-primary/10 text-primary border border-primary/20" : STATUS_BADGE[t.status]?.cls || "bg-surface-variant/50 text-on-surface-variant"}`}>
                      {t.isScanned ? "Used" : STATUS_BADGE[t.status]?.label || t.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
