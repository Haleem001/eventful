import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import BottomNav from "../components/BottomNav";
import api from "../lib/api";
import type { Event, CreateEventPayload, EventCategory } from "../lib/types";

type FormMode = "create" | "edit";

const CATEGORIES = [
  { label: "Other", value: "OTHER" },
  { label: "Concert", value: "CONCERT" },
  { label: "Sports", value: "SPORTS" },
  { label: "Theater", value: "THEATER" },
  { label: "Festival", value: "FESTIVAL" },
  { label: "Workshop", value: "WORKSHOP" },
  { label: "Conference", value: "CONFERENCE" },
];

const REMINDER_OPTIONS = [
  { label: "1 Hour Before", value: "1_HOUR_BEFORE" },
  { label: "1 Day Before", value: "1_DAY_BEFORE" },
  { label: "2 Days Before", value: "2_DAYS_BEFORE" },
  { label: "1 Week Before", value: "1_WEEK_BEFORE" },
  { label: "2 Weeks Before", value: "2_WEEKS_BEFORE" },
];

export default function ManageEvents() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateEventPayload>({
    title: "", description: "", venue: "", date: "", price: 0, capacity: 0, category: "OTHER", reminderConfig: [],
  });

  const fetchEvents = () => {
    api.get<Event[]>("/events/creator")
      .then((res) => setEvents(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast(err.friendlyMessage, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || user.role !== "CREATOR") return;
    fetchEvents();
  }, [user]);

  const openCreate = () => {
    setForm({ title: "", description: "", venue: "", date: "", price: 0, capacity: 0, category: "OTHER", reminderConfig: [] });
    setFormMode("create");
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (ev: Event) => {
    setForm({
      title: ev.title,
      description: ev.description,
      venue: ev.venue,
      date: ev.date.slice(0, 16),
      price: Number(ev.price),
      capacity: ev.capacity,
      category: ev.category,
      reminderConfig: (ev as any).reminderConfig || [],
    });
    setFormMode("edit");
    setEditingId(ev.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (formMode === "create") {
        await api.post("/events", form);
        toast("Event created", "success");
      } else if (editingId) {
        await api.patch(`/events/${editingId}`, form);
        toast("Event updated", "success");
      }
      setShowForm(false);
      fetchEvents();
    } catch (err: any) {
      toast(err.friendlyMessage, "error");
    }
    setSaving(false);
  };

  const confirmDelete = (ev: Event) => {
    if (!window.confirm(`Delete "${ev.title}"? This cannot be undone.`)) return;
    api.delete(`/events/${ev.id}`)
      .then(() => { toast("Event deleted", "success"); fetchEvents(); })
      .catch((err) => toast(err.friendlyMessage, "error"));
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center px-container-margin py-stack-sm">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md-mobile font-black text-primary">My Events</h1>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="bg-primary-container text-on-primary-container p-2 rounded-full hover:opacity-90 active:scale-95 transition-all">
            <span className="material-symbols-outlined">add</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((o) => !o)}
              className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container flex items-center justify-center hover:opacity-80 transition-opacity"
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
        </div>
      </header>

      <main className="pt-[72px] px-container-margin pb-32 max-w-[1200px] mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">event</span>
            <p className="font-body-md text-body-md text-on-surface-variant mb-4">No events yet.</p>
            <button onClick={openCreate} className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-sm text-label-sm">
              Create Event
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {events.map((ev) => (
              <div key={ev.id} className="bg-surface-container rounded-xl p-4 border border-outline-variant/20 shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1 mr-4">
                    <h3 className="font-body-lg text-body-lg font-bold text-on-surface truncate">{ev.title}</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                      {new Date(ev.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{ev.venue}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => navigate(`/manage/tickets/${ev.id}`)} className="p-2 rounded-lg hover:bg-surface-container-high text-primary transition-colors" title="View tickets">
                      <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                    </button>
                    <button onClick={() => openEdit(ev)} className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors" title="Edit">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => confirmDelete(ev)} className="p-2 rounded-lg hover:bg-error/20 text-error transition-colors" title="Delete">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 pt-2 border-t border-outline-variant/20 text-xs text-on-surface-variant">
                  <span>₦{Number(ev.price).toLocaleString()}</span>
                  <span>{ev.ticketsSold}/{ev.capacity} sold</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-surface/80 backdrop-blur-lg flex items-center justify-center px-4 py-8" onClick={() => setShowForm(false)}>
          <div className="bg-surface-container border border-outline-variant/50 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-headline-md text-headline-md-mobile text-on-surface mb-6">
              {formMode === "create" ? "Create Event" : "Edit Event"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block ml-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary font-body-md text-body-md" placeholder="Event name" />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block ml-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary font-body-md text-body-md resize-none" placeholder="Describe your event" />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block ml-1">Venue</label>
                <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary font-body-md text-body-md" placeholder="Venue or virtual link" />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block ml-1">Date & Time</label>
                <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary font-body-md text-body-md" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block ml-1">Price (₦)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required min={0} step="0.01" className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary font-body-md text-body-md" />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block ml-1">Capacity</label>
                  <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} required min={1} className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary font-body-md text-body-md" />
                </div>
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block ml-1">Category</label>
                <select
                  value={form.category || "OTHER"}
                  onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })}
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary font-body-md text-body-md appearance-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block ml-1">Reminders</label>
                <div className="flex flex-wrap gap-2">
                  {REMINDER_OPTIONS.map((opt) => {
                    const selected = form.reminderConfig?.includes(opt.value) || false;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? (form.reminderConfig || []).filter((v) => v !== opt.value)
                            : [...(form.reminderConfig || []), opt.value];
                          setForm({ ...form, reminderConfig: next });
                        }}
                        className={`px-3 py-1.5 rounded-full font-label-sm text-[11px] border transition-colors ${
                          selected
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-surface border-outline-variant/50 text-on-surface-variant hover:border-primary/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p className="font-label-sm text-[11px] text-on-surface-variant/60 mt-1 ml-1">
                  You'll be reminded before the event starts.
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-outline-variant text-on-surface-variant px-4 py-3 rounded-xl font-label-sm text-label-sm hover:bg-surface-container-high transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-on-primary px-4 py-3 rounded-xl font-label-sm text-label-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" /> : formMode === "create" ? "Create" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
