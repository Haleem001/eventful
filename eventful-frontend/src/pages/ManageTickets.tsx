import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import BottomNav from "../components/BottomNav";
import api from "../lib/api";
import type { Event, TicketWithAttendee } from "../lib/types";

export default function ManageTickets() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<TicketWithAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "scanned" | "unscanned">("all");

  useEffect(() => {
    if (!user || user.role !== "CREATOR" || !eventId) return;
    Promise.all([
      api.get<Event>(`/events/${eventId}`).then((r) => setEvent(r.data)),
      api.get<TicketWithAttendee[]>(`/tickets/event/${eventId}`).then((r) => setTickets(r.data)),
    ]).catch((err) => toast(err?.response?.data?.message || "Failed to load tickets", "error"))
      .finally(() => setLoading(false));
  }, [eventId, user]);

  const filtered = tickets.filter((t) => {
    if (filter === "scanned") return t.isScanned;
    if (filter === "unscanned") return !t.isScanned;
    return true;
  });

  const stats = {
    total: tickets.length,
    scanned: tickets.filter((t) => t.isScanned).length,
    pending: tickets.filter((t) => t.status === "PENDING").length,
    paid: tickets.filter((t) => t.status === "PAID").length,
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex items-center gap-3 px-container-margin py-stack-sm">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-body-md text-body-md font-black text-on-surface truncate">{event?.title || "Loading..."}</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">{stats.total} {stats.total === 1 ? "ticket" : "tickets"}</p>
        </div>
      </header>

      <main className="pt-[72px] px-container-margin pb-32 max-w-[800px] mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">confirmation_number</span>
            <p className="font-body-md text-body-md text-on-surface-variant">No tickets for this event yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mt-4 mb-5">
              <div className="bg-surface-container rounded-xl p-3 text-center border border-outline-variant/20">
                <p className="font-headline-sm text-headline-sm text-primary font-black">{stats.paid}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Paid</p>
              </div>
              <div className="bg-surface-container rounded-xl p-3 text-center border border-outline-variant/20">
                <p className="font-headline-sm text-headline-sm text-primary font-black">{stats.scanned}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Scanned</p>
              </div>
              <div className="bg-surface-container rounded-xl p-3 text-center border border-outline-variant/20">
                <p className="font-headline-sm text-headline-sm text-primary font-black">{stats.pending}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Pending</p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              {(["all", "unscanned", "scanned"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm transition-colors ${filter === f ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}
                >
                  {f === "all" ? "All" : f === "scanned" ? "Checked In" : "Not Checked In"}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filtered.map((t) => (
                <div key={t.id} className="bg-surface-container rounded-xl p-4 border border-outline-variant/20">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-body-md text-body-md font-bold text-on-surface">{t.eventee?.email || "Unknown attendee"}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Ref: {t.reference}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        Status: <span className={`font-bold ${t.status === "PAID" ? "text-success" : t.status === "PENDING" ? "text-warning" : "text-error"}`}>{t.status}</span>
                      </p>
                    </div>
                    <div className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${t.isScanned ? "bg-success/20 text-success" : "bg-surface-container-high text-on-surface-variant"}`}>
                      {t.isScanned ? "Checked In" : "Not Checked In"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="text-center py-8 font-body-md text-body-md text-on-surface-variant">
                No {filter !== "all" ? filter : ""} tickets found.
              </p>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
