import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Role } from "../lib/types";

interface Tab {
  label: string;
  icon: string;
  path: string;
  roles: Role[];
}

const allTabs: Tab[] = [
  { label: "Explore", icon: "explore", path: "/explore", roles: ["EVENTEE"] },
  { label: "Tickets", icon: "confirmation_number", path: "/ticket", roles: ["EVENTEE"] },
  { label: "Dashboard", icon: "leaderboard", path: "/dashboard", roles: ["CREATOR"] },
  { label: "Events", icon: "event", path: "/manage/events", roles: ["CREATOR"] },
  { label: "Scanner", icon: "qr_code_scanner", path: "/scan", roles: ["CREATOR"] },
];

export default function BottomNav({ className }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const tabs = user
    ? allTabs.filter((t) => t.roles.includes(user.role))
    : allTabs.filter((t) => t.path === "/explore");

  const activeIndex = tabs.findIndex((t) => {
    if (t.path === "/explore") return location.pathname === "/explore" || location.pathname.startsWith("/event/");
    if (t.path === "/manage/events") return location.pathname.startsWith("/manage/events") || location.pathname.startsWith("/manage/tickets/");
    return t.path === location.pathname;
  });

  return (
    <nav
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] md:w-auto md:min-w-[400px] z-50 flex justify-around items-center px-2 py-2 bg-surface-container/80 backdrop-blur-xl border border-outline-variant/20 shadow-lg rounded-full ${className || ""}`}
    >
      {tabs.map((tab, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={tab.label}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center px-5 py-2 active:scale-90 transition-transform duration-200 ${
              isActive
                ? "bg-primary-container text-on-primary-container rounded-full shadow-md"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined mb-1 text-[20px]"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {tab.icon}
            </span>
            <span className={`font-label-sm text-[10px] ${isActive ? "font-bold" : ""}`}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
