import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import BottomNav from "../components/BottomNav";
import api from "../lib/api";
import type { CreatorAnalytics } from "../lib/types";

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchAnalytics = useCallback((from: string, to: string) => {
    if (!user || user.role !== "CREATOR") return;
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    api.get<CreatorAnalytics>(`/analytics/creator${qs ? `?${qs}` : ""}`)
      .then((res) => setAnalytics(res.data))
      .catch((err) => toast(err?.response?.data?.message || "Failed to load analytics", "error"))
      .finally(() => setLoading(false));
  }, [user, toast]);

  useEffect(() => {
    fetchAnalytics(dateFrom, dateTo);
  }, [dateFrom, dateTo, fetchAnalytics]);

  const breakdown = analytics?.events?.[0];
  const attendanceRate = analytics && analytics.totalTicketsSold > 0
    ? Math.round((analytics.totalScanned / analytics.totalTicketsSold) * 100)
    : 0;

  if (!user || user.role !== "CREATOR") {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center gap-4 px-6">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">lock</span>
        <p className="font-body-md text-body-md text-on-surface-variant text-center">Creator access only.</p>
        <button onClick={() => navigate("/auth")} className="bg-primary text-on-primary px-6 py-2 rounded-full">
          Switch Account
        </button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center px-container-margin py-stack-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-surface-container/60 flex items-center justify-center text-on-surface hover:opacity-80 transition-opacity active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md-mobile font-black text-primary">Eventful</h1>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu((o) => !o)}
            className="hover:opacity-80 transition-opacity w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-sm text-on-surface">person</span>
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-10 z-50 bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl min-w-[180px] overflow-hidden">
                <div className="px-4 py-3 border-b border-outline-variant/20">
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); navigate("/profile"); }}
                  className="w-full flex items-center gap-2 px-4 py-3 font-body-md text-body-md text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  Profile
                </button>
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

      <main className="pt-[80px] px-container-margin pb-32 max-w-[1200px] mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !analytics ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">bar_chart</span>
            <p className="font-body-md text-body-md text-on-surface-variant">Could not load analytics.</p>
          </div>
        ) : (
          <>
            <section className="mb-stack-lg">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-stack-sm">
                Welcome back, {user.email?.split("@")[0] || "Creator"}
              </h2>
              <div className="flex items-center justify-between bg-surface-container rounded-xl p-3 border border-outline-variant/20 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant">calendar_today</span>
                  <span className="font-body-md text-body-md text-on-surface">
                    {breakdown?.title || "No active events"}
                  </span>
                </div>
                <button onClick={() => navigate("/manage/events")} className="flex items-center gap-1 text-primary hover:opacity-80 transition-opacity p-2 rounded-lg hover:bg-surface-container-high active:scale-95">
                  <span className="font-label-sm text-label-sm">View All</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </section>

            <section className="flex items-center gap-3 mb-stack-sm">
              <div className="flex-1">
                <label className="font-label-sm text-[11px] text-on-surface-variant mb-1 block ml-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex-1">
                <label className="font-label-sm text-[11px] text-on-surface-variant mb-1 block ml-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="self-end p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
                  title="Clear filter"
                >
                  <span className="material-symbols-outlined text-[18px]">clear</span>
                </button>
              )}
            </section>
            <section className="grid grid-cols-2 gap-gutter mb-stack-lg">
              <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/20 shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Tickets Sold</span>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded-md text-[16px]">
                    confirmation_number
                  </span>
                </div>
                <div className="font-headline-md text-headline-md-mobile text-on-surface mb-1">
                  {analytics.totalTicketsSold.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span className="font-label-sm text-label-sm">Total sales</span>
                </div>
              </div>

              <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/20 shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Revenue</span>
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded-md text-[16px]">
                    payments
                  </span>
                </div>
                <div className="font-headline-md text-headline-md-mobile text-on-surface mb-1">
                  ₦ {(analytics.totalRevenue / 1000).toFixed(1)}K
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span className="font-label-sm text-label-sm">Total revenue</span>
                </div>
              </div>

              <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/20 shadow-lg flex flex-col items-center justify-center relative overflow-hidden group col-span-2 sm:col-span-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-3 absolute top-4 left-4">Attendance</span>
                <div className="relative w-24 h-24 mt-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-variant"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="text-primary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${attendanceRate}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3"
                      style={{ filter: "drop-shadow(0 0 8px rgba(78,222,163,0.5))" }}
                    />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <span className="font-headline-md text-headline-md-mobile text-on-surface block leading-none">{attendanceRate}%</span>
                  </div>
                </div>
                <div className="font-label-sm text-label-sm text-on-surface-variant mt-3">
                  {breakdown ? `${analytics.totalScanned} / ${analytics.totalTicketsSold} Checked-in` : "No data"}
                </div>
              </div>

              <div
                onClick={() => navigate("/scan")}
                className="bg-primary-container rounded-xl p-4 border border-outline-variant/20 shadow-lg flex flex-col items-center justify-center relative overflow-hidden group col-span-2 sm:col-span-1 cursor-pointer active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[48px] text-on-primary-container mb-2 drop-shadow-md">
                  qr_code_scanner
                </span>
                <span className="font-headline-md text-[18px] font-bold text-on-primary-container">Open Scanner</span>
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-stack-md">
                <h3 className="font-body-lg text-body-lg text-on-surface font-semibold">Events</h3>
                <button onClick={() => navigate("/manage/events")} className="font-label-sm text-label-sm text-primary hover:underline">View All</button>
              </div>
              {analytics.events.length === 0 ? (
                <div className="text-center py-10 bg-surface-container rounded-xl border border-outline-variant/20">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">event</span>
                  <p className="font-body-md text-body-md text-on-surface-variant">No events created yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.events.map((ev) => (
                    <div
                      key={ev.eventId}
                      onClick={() => navigate(`/manage/tickets/${ev.eventId}`)}
                      className="bg-surface-container rounded-xl p-4 border border-outline-variant/20 shadow-lg flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-body-md text-body-md text-on-surface font-medium truncate">{ev.title}</p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          {ev.ticketsSold}/{ev.capacity} sold • ₦{(ev.revenue / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-label-sm text-label-sm text-primary">{ev.scanned} scanned</span>
                        <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_right</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
