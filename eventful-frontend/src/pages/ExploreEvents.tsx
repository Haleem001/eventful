import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import api from "../lib/api";
import type { Event, PaginatedEventsResponse } from "../lib/types";
import ShareButton from "../components/ShareButton";

const CATEGORIES = [
  { label: "All Events", value: "" },
  { label: "Concerts", value: "CONCERT" },
  { label: "Sports", value: "SPORTS" },
  { label: "Theater", value: "THEATER" },
  { label: "Festivals", value: "FESTIVAL" },
  { label: "Workshops", value: "WORKSHOP" },
  { label: "Conferences", value: "CONFERENCE" },
  { label: "Other", value: "OTHER" },
];

const PAGE_SIZE = 10;

export default function ExploreEvents() {
  const [activeCategory, setActiveCategory] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const fetchEvents = (p: number, cat: string, q: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", String(PAGE_SIZE));
    if (cat) params.set("category", cat);
    if (q) params.set("search", q);

    api.get<PaginatedEventsResponse>(`/events?${params.toString()}`)
      .then((res) => {
        setEvents(Array.isArray(res.data.data) ? res.data.data : []);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => toast(err.friendlyMessage, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents(1, activeCategory, search);
  }, [activeCategory]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setPage(1);
      fetchEvents(1, activeCategory, val);
    }, 300);
  };

  const goToPage = (p: number) => {
    setPage(p);
    fetchEvents(p, activeCategory, search);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const formatPrice = (price: string) => {
    const n = Number(price);
    return n >= 1000 ? `₦${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : `₦${n.toLocaleString()}`;
  };

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <header className="bg-surface/80 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-outline-variant/30 flex items-center justify-between px-container-margin py-stack-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-surface-container/60 flex items-center justify-center text-on-surface hover:opacity-80 transition-opacity active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md-mobile font-black text-primary">
          Eventful
        </h1>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu((o) => !o)}
            className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/50 flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm text-on-surface">person</span>
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-10 z-50 bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl min-w-[180px] overflow-hidden">
                {user && (
                  <div className="px-4 py-3 border-b border-outline-variant/20">
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{user.email}</p>
                  </div>
                )}
                {user ? (
                  <>
                    <button
                      onClick={() => { setShowUserMenu(false); navigate("/profile"); }}
                      className="w-full flex items-center gap-2 px-4 py-3 font-body-md text-body-md text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      Profile
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); navigate("/reminders"); }}
                      className="w-full flex items-center gap-2 px-4 py-3 font-body-md text-body-md text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">notifications</span>
                      Reminders
                    </button>
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); navigate("/"); }}
                      className="w-full flex items-center gap-2 px-4 py-3 font-body-md text-body-md text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setShowUserMenu(false); navigate("/auth"); }}
                    className="w-full flex items-center gap-2 px-4 py-3 font-body-md text-body-md text-primary hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    Sign In
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <main className="pt-[72px] pb-[100px] max-w-[1200px] mx-auto">
        <div className="px-container-margin pt-stack-sm pb-2">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/50 rounded-xl pl-10 pr-4 py-3 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body-md text-body-md"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); fetchEvents(1, activeCategory, ""); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>

        <section className="px-container-margin">
          <div className="flex overflow-x-auto gap-3 hide-scrollbar pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setActiveCategory(cat.value); setPage(1); }}
                className={`px-4 py-2 rounded-full font-label-sm text-label-sm whitespace-nowrap active:scale-95 transition-transform ${
                  activeCategory === cat.value
                    ? "bg-primary/20 border border-primary text-primary"
                    : "bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">event_busy</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {search ? "No events match your search." : activeCategory ? "No events in this category yet." : "No events yet. Check back soon!"}
            </p>
          </div>
        ) : (
          <>
            {events.length > 0 && (
              <section className="px-container-margin mb-stack-lg">
                <div className="relative w-full h-[320px] rounded-xl overflow-hidden group cursor-pointer border border-outline-variant/20 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-surface-container-highest via-surface-container to-surface-container-lowest">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-50"></div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 w-full p-container-margin flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-label-sm text-label-sm backdrop-blur-md">Next Up</span>
                        </div>
                        <h2 className="font-headline-md text-headline-md-mobile text-on-background mb-1">{events[0].title}</h2>
                        <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span>{events[0].venue}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-headline-md text-headline-md-mobile text-primary">
                        {formatPrice(events[0].price)}
                      </span>
                      <div className="flex items-center gap-2">
                        <ShareButton
                          url={`${window.location.origin}/event/${events[0].id}`}
                          title={events[0].title}
                        />
                        <button
                          onClick={() => navigate(`/event/${events[0].id}`)}
                          className="bg-primary text-on-primary font-label-sm text-label-sm px-5 py-2.5 rounded-full hover:opacity-90 active:scale-95 transition-all"
                          style={{ boxShadow: "0 0 15px rgba(78,222,163,0.3)" }}
                        >
                          Get Tickets
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="px-container-margin flex flex-col gap-stack-md">
              <div className="flex justify-between items-center">
                <h3 className="font-headline-md text-[18px] text-on-background">
                  {search ? `Results (${total})` : "Upcoming Events"}
                </h3>
                {total > 0 && (
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {total} event{total !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {events.map((event) => {
                const dateLabel = formatDate(event.date);
                return (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="bg-surface-container rounded-xl border border-outline-variant/20 flex flex-row min-h-[130px] active:scale-[0.98] transition-transform cursor-pointer hover:border-primary/50"
                  >
                    <div className="w-[120px] h-full flex-shrink-0 relative bg-surface-container-highest flex items-center justify-center">
                      <div className="text-center">
                        <div className="font-label-sm text-label-sm text-primary">
                          {dateLabel.split(" ")[0]}
                        </div>
                        <div className="font-headline-md text-[20px] text-on-background leading-none mt-0.5">
                          {dateLabel.split(" ")[1]}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 flex flex-col justify-between flex-grow min-w-0">
                      <div>
                        <h4 className="font-body-lg text-[16px] font-bold text-on-background line-clamp-1">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm mt-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>{formatTime(event.date)}</span>
                          <span className="mx-1">•</span>
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span className="truncate">{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded font-label-sm text-[10px]">
                            {event.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span className="font-body-md font-semibold text-on-background shrink-0">
                          {formatPrice(event.price)}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <div onClick={(e) => e.stopPropagation()}>
                            <ShareButton
                              url={`${window.location.origin}/event/${event.id}`}
                              title={event.title}
                            />
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/event/${event.id}`); }}
                            className="border border-outline-variant text-on-surface px-2.5 py-1.5 rounded-full font-label-sm text-[11px] whitespace-nowrap hover:bg-surface-container-higher transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {totalPages > 1 && (
              <section className="px-container-margin mt-6 flex items-center justify-center gap-4">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={!canGoPrev}
                  className="flex items-center gap-1 px-4 py-2 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface font-label-sm text-label-sm hover:bg-surface-container-highest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Prev
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-8 h-8 rounded-full font-label-sm text-label-sm transition-colors ${
                        p === page
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-highest"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={!canGoNext}
                  className="flex items-center gap-1 px-4 py-2 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface font-label-sm text-label-sm hover:bg-surface-container-highest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
