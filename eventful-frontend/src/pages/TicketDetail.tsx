import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import BottomNav from "../components/BottomNav";
import api from "../lib/api";
import type { Ticket } from "../lib/types";
import { SkeletonTicketDetail } from "../components/Skeleton";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PAID: { label: "Paid", cls: "bg-primary/10 text-primary border border-primary/20" },
  PENDING: { label: "Pending", cls: "bg-warning/10 text-warning border border-warning/20" },
  CANCELLED: { label: "Cancelled", cls: "bg-error/10 text-error border border-error/20" },
};

export default function TicketDetail() {
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId: string }>();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    api.get<Ticket>(`/tickets/${ticketId}`)
      .then((res) => setTicket(res.data))
      .catch((err) => toast(err.friendlyMessage, "error"))
      .finally(() => setLoading(false));
  }, [ticketId, toast]);

  if (loading) return <SkeletonTicketDetail />;

  if (!ticket) {
    return (
      <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col">
        <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex items-center px-container-margin py-stack-sm h-16">
          <button onClick={() => navigate("/ticket")} className="text-on-surface-variant hover:opacity-80 transition-opacity p-2 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md-mobile font-black text-primary ml-2">Ticket</h1>
        </header>
        <main className="flex-grow flex flex-col items-center justify-center px-6 pt-16">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">error_outline</span>
          <p className="font-body-md text-body-md text-on-surface-variant">Ticket not found.</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col relative overflow-x-hidden">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex items-center px-container-margin py-stack-sm h-16">
        <button onClick={() => navigate("/ticket")} className="text-on-surface-variant hover:opacity-80 transition-opacity p-2 rounded-full">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md-mobile font-black text-primary ml-2">{ticket.event?.title || "Ticket"}</h1>
      </header>

      <main className="flex-grow flex flex-col w-full max-w-md mx-auto px-container-margin pt-20 pb-32 z-10 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

        <div className="z-10 w-full bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm">
          <div className="h-24 w-full relative bg-surface-container-highest flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-primary/20">confirmation_number</span>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-body-lg text-body-lg text-on-surface font-semibold">{ticket.event?.title || "Event Ticket"}</h2>
              <span className={`px-3 py-1 rounded-full font-label-sm text-[11px] ${STATUS_BADGE[ticket.status]?.cls || "bg-surface-variant/50 text-on-surface-variant"}`}>
                {STATUS_BADGE[ticket.status]?.label || ticket.status}
              </span>
            </div>

            {ticket.isScanned && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                <p className="font-label-sm text-label-sm text-primary">Ticket has been used / checked in</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">tag</span>
                <div>
                  <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Ticket ID</p>
                  <p className="font-body-md text-body-md text-on-surface font-mono">{ticket.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">qr_code</span>
                <div>
                  <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Reference</p>
                  <p className="font-body-md text-body-md text-on-surface font-mono font-semibold">{ticket.reference.toUpperCase()}</p>
                </div>
              </div>
              {ticket.event?.venue && (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">stadium</span>
                  <div>
                    <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Venue</p>
                    <p className="font-body-md text-body-md text-on-surface">{ticket.event.venue}</p>
                  </div>
                </div>
              )}
              {ticket.event?.date && (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">calendar_today</span>
                  <div>
                    <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Date</p>
                    <p className="font-body-md text-body-md text-on-surface">
                      {new Date(ticket.event.date).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">schedule</span>
                <div>
                  <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Purchased</p>
                  <p className="font-body-md text-body-md text-on-surface">
                    {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {ticket.status === "PAID" && !ticket.isScanned && (
          <>
            <div className="z-10 mt-6 bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm p-5">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-4 text-center uppercase tracking-wider">QR Code</p>
              <div className="flex justify-center">
                <div className="relative bg-white p-4 rounded-xl shadow-[0_0_20px_rgba(78,222,163,0.1)] border-2 border-primary/20">
                  <div className="w-48 h-48 bg-white flex items-center justify-center">
                    {ticket.qrCode ? (
                      <img src={ticket.qrCode} alt="QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <span className="material-symbols-outlined text-5xl">qr_code</span>
                        <span className="font-label-sm text-[10px]">{ticket.qrToken || ticket.reference.slice(0, 10)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!window.confirm("Cancel this ticket? This action cannot be undone.")) return;
                setCancelling(true);
                try {
                  await api.patch(`/tickets/${ticketId}/cancel`);
                  toast("Ticket cancelled", "success");
                  const res = await api.get<Ticket>(`/tickets/${ticketId}`);
                  setTicket(res.data);
                } catch (err: any) {
                  toast(err.friendlyMessage, "error");
                }
                setCancelling(false);
              }}
              disabled={cancelling}
              className="z-10 mt-4 w-full border border-error/50 text-error px-4 py-3 rounded-xl font-label-sm text-label-sm hover:bg-error/10 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cancelling ? <span className="w-4 h-4 border-2 border-error border-t-transparent rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-[18px]">cancel</span> Cancel Ticket</>}
            </button>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
