import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/api";
import type { Event, PaginatedEventsResponse } from "../lib/types";
import ShareButton from "../components/ShareButton";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api
      .get<PaginatedEventsResponse>("/events?limit=6")
      .then((res) => {
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setEvents(data);
      })
      .catch(() => {});
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const formatPrice = (price: string) => `₦${Number(price).toLocaleString()}`;

  const featuredEvent = events[0];
  const otherEvents = events.slice(1, 6);

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background overflow-x-hidden relative">
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-outline-variant/30"
        style={{
          background: "rgba(11, 19, 38, 0.8)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-container-margin py-4 flex justify-between items-center gap-3">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform shrink-0"
          >
            <span className="material-symbols-outlined text-primary text-xl md:text-2xl">local_activity</span>
            <span className="font-headline-md text-lg md:text-headline-md font-black text-primary tracking-tight">
              Eventful
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate("/explore")}
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary px-4 py-2 rounded-full transition-colors"
            >
              Explore
            </button>
            {user ? (
              <button
                onClick={() => navigate(user.role === "CREATOR" ? "/dashboard" : "/ticket")}
                className="font-body-md text-body-md bg-primary-container text-on-primary-container font-bold px-5 py-2 rounded-full hover:opacity-90 transition-all active:scale-95"
              >
                {user.role === "CREATOR" ? "Dashboard" : "My Tickets"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/auth/login")}
                  className="font-body-md text-body-md border border-outline-variant text-on-surface-variant px-5 py-2 rounded-full hover:border-primary hover:text-primary transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/auth/signup")}
                  className="font-body-md text-body-md bg-primary-container text-on-primary-container font-bold px-5 py-2 rounded-full hover:opacity-90 transition-all active:scale-95"
                >
                  Sign Up
                </button>
              </>
            )}
          </nav>

          <div className="flex md:hidden items-center gap-2 shrink-0">
            {!user && (
              <button
                onClick={() => navigate("/auth")}
                className="font-label-sm text-label-sm text-primary font-semibold px-3 py-1.5 rounded-full border border-primary/30 hover:bg-primary/10 transition-colors"
              >
                Sign In
              </button>
            )}
            <button
              className="text-primary"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden mobile-nav-overlay flex flex-col items-center justify-center gap-8 px-6"
          style={{
            background: "rgba(11, 19, 38, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              navigate("/explore");
            }}
            className="font-headline-lg text-headline-lg-mobile text-on-background hover:text-primary transition-colors"
          >
            Explore
          </button>
          {user ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(user.role === "CREATOR" ? "/dashboard" : "/ticket");
              }}
              className="font-body-md text-body-md bg-primary-container text-on-primary-container font-bold px-10 py-4 rounded-full transition-all active:scale-95"
            >
              {user.role === "CREATOR" ? "Dashboard" : "My Tickets"}
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/auth/signup");
                }}
                className="font-body-md text-body-md bg-primary-container text-on-primary-container font-bold px-10 py-4 rounded-full transition-all active:scale-95"
              >
                Sign Up
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/auth/login");
                }}
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      )}

      <main className="flex-grow pt-24 pb-20 relative overflow-hidden">
        <section className="relative max-w-7xl mx-auto px-container-margin pt-10 pb-16">
          <div
            aria-hidden="true"
            className="absolute -top-10 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute right-[-10rem] top-28 h-80 w-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none"
          />

          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-0 select-none">
                <div className="rounded-l-md border border-r-0 border-outline-variant/25 bg-surface-container/80 px-3 py-1.5 shadow-sm">
                  <span className="font-mono text-[10px] font-semibold tracking-wider text-primary/80">
                    EVENTFUL
                  </span>
                </div>
                <div className="flex items-center gap-[2px] px-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-3 w-[2px] rounded-full bg-outline-variant/30"
                    />
                  ))}
                </div>
                <div className="rounded-r-md border border-l-0 border-outline-variant/25 bg-surface-container/80 px-3 py-1.5 shadow-sm">
                  <span className="font-mono text-[10px] tabular-nums text-on-surface-variant/70">
                    {events.length || 0} events
                  </span>
                </div>
              </div>

              <h1 className="mt-5 font-headline-lg text-[34px] sm:text-[44px] lg:text-[56px] text-on-background leading-[1.02] tracking-tight">
                Discover, sell, and scan
                <span className="block text-primary">with one clean flow.</span>
              </h1>

              <p className="mt-5 max-w-xl mx-auto lg:mx-0 font-body-lg text-body-lg text-on-surface-variant">
                Eventful helps guests find great experiences and helps creators manage ticketing without the clutter.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={() => navigate("/explore")}
                  className="w-full sm:w-auto bg-primary-container text-on-primary-container font-headline-md text-[16px] font-bold px-7 py-3.5 rounded-full hover:opacity-90 active:scale-95 transition-all inline-flex items-center justify-center gap-2"
                  style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.28)" }}
                >
                  Browse Events
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button
                  onClick={() => navigate(user ? (user.role === "CREATOR" ? "/dashboard" : "/ticket") : "/auth")}
                  className="w-full sm:w-auto border border-outline-variant/40 bg-surface-container/60 text-on-surface font-headline-md text-[16px] font-bold px-7 py-3.5 rounded-full hover:border-primary hover:text-primary transition-colors"
                >
                  {user ? (user.role === "CREATOR" ? "Open Dashboard" : "View Tickets") : "Create Account"}
                </button>
              </div>

              </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-outline-variant/20 bg-surface-container/80 p-4 shadow-2xl shadow-black/20 backdrop-blur-md overflow-hidden">
                <div className="rounded-[1.5rem] border border-outline-variant/20 bg-gradient-to-br from-surface-container-highest via-surface-container to-surface-container-low p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-label-sm text-label-sm uppercase tracking-[0.18em] text-primary">Next Up</p>
                      <h2 className="mt-2 font-headline-md text-headline-md-mobile text-on-surface">
                        {featuredEvent ? featuredEvent.title : "Your next event"}
                      </h2>
                    </div>
                    <div className="rounded-2xl bg-primary/10 border border-primary/20 px-3 py-2 text-right shrink-0">
                      <p className="font-label-sm text-label-sm text-primary">Tickets</p>
                      <p className="font-headline-md text-[20px] text-on-surface">
                        {featuredEvent ? featuredEvent.ticketsSold : 0}
                      </p>
                    </div>
                  </div>

                  {featuredEvent ? (
                    <div className="mt-6 grid gap-4 sm:grid-cols-[1.1fr_0.9fr] items-center">
                      <div className="rounded-2xl overflow-hidden border border-outline-variant/20 bg-surface-container-high p-4">
                        <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent flex items-center justify-center">
                          <span className="material-symbols-outlined text-7xl text-primary/40">event</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-xl bg-surface/70 border border-outline-variant/20 px-4 py-3">
                          <p className="font-label-sm text-label-sm text-on-surface-variant">Date</p>
                          <p className="mt-1 font-body-lg text-body-lg text-on-surface">{formatDate(featuredEvent.date)}</p>
                        </div>
                        <div className="rounded-xl bg-surface/70 border border-outline-variant/20 px-4 py-3">
                          <p className="font-label-sm text-label-sm text-on-surface-variant">Venue</p>
                          <p className="mt-1 font-body-lg text-body-lg text-on-surface truncate">{featuredEvent.venue}</p>
                        </div>
                        <div className="rounded-xl bg-surface/70 border border-outline-variant/20 px-4 py-3">
                          <p className="font-label-sm text-label-sm text-on-surface-variant">From</p>
                          <p className="mt-1 font-body-lg text-body-lg text-primary font-semibold">{formatPrice(featuredEvent.price)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-2xl border border-dashed border-outline-variant/30 bg-surface/50 py-16 text-center">
                      <span className="material-symbols-outlined text-5xl text-primary/30">celebration</span>
                      <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
                        Fresh events will appear here once published.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-container-margin pb-6">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="font-label-sm text-label-sm text-primary uppercase tracking-[0.18em]">Browse</p>
              <h2 className="mt-1 font-headline-md text-headline-md text-on-surface">Upcoming Events</h2>
            </div>
            <button
              onClick={() => navigate("/explore")}
              className="text-primary font-label-sm text-label-sm hover:underline shrink-0"
            >
              View All
            </button>
          </div>

          {events.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-on-surface-variant rounded-3xl border border-outline-variant/20 bg-surface-container/60">
              <span className="material-symbols-outlined mr-2">event_busy</span>
              <span className="font-body-md text-body-md">No upcoming events</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(featuredEvent ? [featuredEvent, ...otherEvents] : events.slice(0, 6)).map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/event/${event.id}`)}
                  className="bg-surface-container rounded-2xl border border-outline-variant/20 cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98] group shadow-lg shadow-black/10"
                >
                  <div className="h-44 bg-gradient-to-br from-surface-container-highest via-surface-container to-surface-container-low flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(78,222,163,0.16),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(188,199,222,0.08),transparent_38%)]" />
                    <div className="absolute top-3 left-3 bg-surface/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-center border border-outline-variant/30">
                      <div className="font-label-sm text-label-sm text-primary leading-none">
                        {formatDate(event.date).split(" ")[0]}
                      </div>
                      <div className="font-headline-md text-[18px] text-on-surface leading-none mt-0.5">
                        {formatDate(event.date).split(" ")[1]}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-5xl text-primary/20 group-hover:scale-110 transition-transform">
                      celebration
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-body-lg text-body-lg font-bold text-on-surface line-clamp-1 mb-1">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>
                        {formatDate(event.date)} · {formatTime(event.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-outline-variant/20">
                      <span className="font-headline-md text-[18px] text-primary">{formatPrice(event.price)}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-label-sm text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full">
                          {event.ticketsSold} going
                        </span>
                        <div onClick={(e) => e.stopPropagation()}>
                          <ShareButton
                            url={`${window.location.origin}/event/${event.id}`}
                            title={event.title}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-surface-container border-t border-outline-variant/20 py-8">
        <div className="max-w-7xl mx-auto px-container-margin flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">local_activity</span>
              <span className="font-headline-md text-base font-black text-on-background">Eventful</span>
            </div>
            <p className="mt-2 text-sm text-on-surface-variant max-w-md">
              A cleaner way for people to discover events and for creators to manage tickets.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 text-xs text-on-surface-variant">
            <span>&copy; 2026 Eventful. All rights reserved.</span>
            <span>Built for mobile-first ticketing.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
