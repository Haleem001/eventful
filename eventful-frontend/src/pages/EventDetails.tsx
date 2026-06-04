import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import api from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import type { Event, InitializePaymentResponse } from "../lib/types";
import ShareButton from "../components/ShareButton";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [reminder, setReminder] = useState("none");

  useEffect(() => {
    if (!id) return;
    api.get<Event>(`/events/${id}`)
      .then((res) => setEvent(res.data))
      .catch(() => navigate("/explore"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleBuyTicket = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setBuying(true);
    try {
      const { data } = await api.post<InitializePaymentResponse>("/payments/initialize", {
        eventId: id,
        callbackUrl: window.location.origin + "/ticket",
        reminder: reminder !== "none" ? reminder : undefined,
      });
      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      toast(err?.response?.data?.message || "Payment initiation failed", "error");
    }
    setBuying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) return null;

  const eventDate = new Date(event.date);
  const dayName = eventDate.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timeStr = eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background text-on-background relative overflow-x-hidden md:flex md:justify-center">
      <div className="w-full md:max-w-[420px] relative min-h-screen md:min-h-[884px] flex flex-col bg-surface overflow-x-hidden md:border-x md:border-outline-variant/30">
        <div className="absolute top-0 w-full z-50 flex justify-between items-center px-container-margin py-stack-md pt-10">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-surface-container/60 backdrop-blur-md flex items-center justify-center text-on-surface hover:opacity-80 transition-opacity active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex gap-gutter">
            <button className="w-10 h-10 rounded-full bg-surface-container/60 backdrop-blur-md flex items-center justify-center text-on-surface hover:opacity-80 transition-opacity active:scale-95">
              <span className="material-symbols-outlined">favorite_border</span>
            </button>
            <ShareButton
              url={`${window.location.origin}/event/${event.id}`}
              title={event.title}
              description={`${event.title} — ${event.venue} on ${dayName}, ${monthDay} at ${timeStr}`}
            />
          </div>
        </div>

        <div className="relative w-full h-[400px] md:h-[530px] shrink-0 bg-gradient-to-br from-surface-container-highest via-surface-container to-surface-container-lowest">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
          <div className="absolute bottom-8 left-container-margin right-container-margin">
            <div className="inline-flex items-center gap-1.5 bg-surface/60 backdrop-blur-md px-3 py-1.5 rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-on-surface">{event.ticketsSold} going</span>
            </div>
          </div>
        </div>

        <div className="relative -mt-10 w-full bg-surface rounded-t-[32px] flex flex-col flex-1 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-40">
          <div className="w-full flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-outline-variant rounded-full"></div>
          </div>

          <div className="flex-1 overflow-y-auto px-container-margin pb-[140px] pt-stack-sm">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-stack-md leading-tight">
              {event.title}
            </h1>

            <div className="flex items-center gap-3 mb-stack-lg bg-surface-container/50 p-3 rounded-xl border border-outline-variant/20">
              <div className="w-12 h-12 rounded-full bg-surface-container-higher flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">celebration</span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <p className="font-body-md text-body-md text-on-surface-variant">Hosted by</p>
                <p className="font-body-lg text-body-lg text-on-surface font-semibold truncate">Event Creator</p>
              </div>
              <button className="shrink-0 px-4 py-1.5 rounded-full border border-primary text-primary font-label-sm text-label-sm hover:bg-primary/10 transition-colors">
                Follow
              </button>
            </div>

            <div className="grid gap-stack-md mb-stack-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                </div>
                <div className="min-w-0">
                  <p className="font-body-lg text-body-lg text-on-surface font-semibold">{dayName}, {monthDay}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">{timeStr}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                </div>
                <div className="min-w-0">
                  <p className="font-body-lg text-body-lg text-on-surface font-semibold">{event.venue}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">Capacity: {event.capacity}</p>
                </div>
              </div>
            </div>

            <div className="mb-stack-lg">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-sm">About Event</h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {event.description}
              </p>
            </div>

            <div className="mb-stack-lg">
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 ml-1">Set Reminder</label>
              <div className="relative">
                <select
                  value={reminder}
                  onChange={(e) => setReminder(e.target.value)}
                  className="w-full appearance-none bg-surface-container border border-outline-variant/50 text-on-surface font-body-md text-body-md rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="none">Don't remind me</option>
                  <option value="1hour">1 Hour Before</option>
                  <option value="1day">1 Day Before</option>
                  <option value="1week">1 Week Before</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            <div className="w-full h-32 bg-surface-container rounded-xl overflow-hidden relative mb-stack-lg border border-outline-variant/30">
              <div className="absolute inset-0 bg-gradient-to-br from-surface-container-highest to-surface-container"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined">map</span>
                  <span className="font-body-md text-sm">{event.venue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 w-full bg-surface/80 backdrop-blur-xl border-t border-outline-variant/20 px-container-margin py-stack-md z-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Total Price</p>
              <p className="font-headline-md text-headline-md text-on-surface">
                ₦{Number(event.price).toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleBuyTicket}
              disabled={buying}
              className="bg-primary text-on-primary-fixed font-headline-md text-headline-md px-8 py-3 rounded-full hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              style={{ boxShadow: buying ? "none" : "0 0 20px rgba(78,222,163,0.3)" }}
            >
              {buying ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                "Buy Ticket"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
