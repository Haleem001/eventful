import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/api";
import type { Ticket } from "../lib/types";

type CallbackState = "verifying" | "success" | "error" | "idle";

export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [state, setState] = useState<CallbackState>("idle");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const verifiedRef = useRef(false);

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference || !user || verifiedRef.current) return;
    verifiedRef.current = true;
    setState("verifying");
    api.post("/payments/verify", { reference })
      .then((res) => {
        setTicket(res.data as Ticket);
        setState("success");
      })
      .catch((err) => {
        setErrorMsg(err.friendlyMessage || "Payment verification failed.");
        setState("error");
      });
  }, [searchParams, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-on-background antialiased flex flex-col items-center justify-center gap-4 px-6">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">lock</span>
        <p className="font-body-md text-body-md text-on-surface-variant text-center">Sign in to confirm your payment.</p>
        <button onClick={() => navigate("/auth")} className="bg-primary text-on-primary px-6 py-2 rounded-full">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background antialiased flex flex-col items-center justify-center px-6">
      {state === "verifying" && (
        <div className="flex flex-col items-center gap-4">
          <span className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-body-md text-body-md text-on-surface-variant">Verifying your payment...</p>
        </div>
      )}

      {state === "success" && ticket && (
        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>

          <div className="text-center">
            <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-1">Payment Successful!</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Your ticket is ready.</p>
          </div>

          <div className="w-full bg-surface-container rounded-2xl border border-outline-variant/20 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">confirmation_number</span>
              <div className="min-w-0">
                <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Reference</p>
                <p className="font-body-md text-body-md text-on-surface font-mono font-semibold truncate">
                  {ticket.reference.toUpperCase()}
                </p>
              </div>
            </div>
            {ticket.event?.title && (
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">event</span>
                <div className="min-w-0">
                  <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Event</p>
                  <p className="font-body-md text-body-md text-on-surface truncate">{ticket.event.title}</p>
                </div>
              </div>
            )}
            {ticket.event?.date && (
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">calendar_today</span>
                <div className="min-w-0">
                  <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Date</p>
                  <p className="font-body-md text-body-md text-on-surface">
                    {new Date(ticket.event.date).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate(`/ticket/${ticket.id}`)}
            className="w-full bg-primary text-on-primary font-headline-md text-[16px] font-bold px-6 py-3.5 rounded-full hover:opacity-90 active:scale-95 transition-all text-center"
            style={{ boxShadow: "0 0 20px rgba(78,222,163,0.3)" }}
          >
            View My Ticket
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
              cancel
            </span>
          </div>
          <div className="text-center">
            <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-1">Verification Failed</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{errorMsg}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/ticket")}
              className="border border-outline-variant/50 text-on-surface px-6 py-2.5 rounded-full font-label-sm text-label-sm hover:bg-surface-container transition-colors"
            >
              My Tickets
            </button>
            <button
              onClick={() => navigate("/explore")}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-sm text-label-sm hover:opacity-90 active:scale-95 transition-all"
            >
              Browse Events
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
