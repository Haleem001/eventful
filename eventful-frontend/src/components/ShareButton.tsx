import { useState, useRef, useEffect } from "react";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
}

const SHARE_PLATFORMS = [
  {
    name: "Facebook",
    icon: "facebook",
    getUrl: (u: string, t: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}&quote=${encodeURIComponent(t)}`,
    color: "hover:text-[#1877F2]",
  },
  {
    name: "Twitter / X",
    icon: "x",
    getUrl: (u: string, t: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}`,
    color: "hover:text-on-surface",
  },
  {
    name: "WhatsApp",
    icon: "whatsapp",
    getUrl: (u: string, t: string) =>
      `https://wa.me/?text=${encodeURIComponent(t + " " + u)}`,
    color: "hover:text-[#25D366]",
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    getUrl: (u: string, _t: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
    color: "hover:text-[#0A66C2]",
  },
  {
    name: "Telegram",
    icon: "telegram",
    getUrl: (u: string, t: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
    color: "hover:text-[#0088cc]",
  },
];

export default function ShareButton({ url, title, description }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleShare = async () => {
    const shareData = { title, text: description || title, url };
    if (navigator.share && window.innerWidth < 768) {
      try {
        await navigator.share(shareData);
        setOpen(false);
        return;
      } catch {
        setOpen(true);
      }
    } else {
      setOpen((o) => !o);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleShare}
        className="w-10 h-10 rounded-full bg-surface-container/60 backdrop-blur-md flex items-center justify-center text-on-surface hover:opacity-80 transition-opacity active:scale-95"
      >
        <span className="material-symbols-outlined">share</span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[200] min-w-[220px] bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/20">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Share event</p>
          </div>

          <div className="p-2 space-y-1">
            {SHARE_PLATFORMS.map((p) => (
              <a
                key={p.name}
                href={p.getUrl(url, title)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-body-md text-body-md text-on-surface ${p.color} hover:bg-surface-container-high transition-colors active:scale-[0.98]`}
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">share</span>
                {p.name}
              </a>
            ))}

            <button
              onClick={copyLink}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-body-md text-body-md text-on-surface hover:bg-surface-container-high transition-colors active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                {copied ? "check" : "link"}
              </span>
              {copied ? "Link copied!" : "Copy link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
