import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <span className="material-symbols-outlined text-7xl text-on-surface-variant/30 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
          search_off
        </span>
        <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-2">404</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-8">This page doesn't exist.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="border border-outline-variant/50 text-on-surface px-6 py-2.5 rounded-full font-label-sm text-label-sm hover:bg-surface-container transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-sm text-label-sm hover:opacity-90 active:scale-95 transition-all"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
