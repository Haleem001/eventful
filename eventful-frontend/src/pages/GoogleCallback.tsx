import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthFromToken } = useAuth();
  const [error, setError] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setError("No authentication token received.");
      return;
    }
    try {
      const user = setAuthFromToken(token);
      navigate(user.role === "CREATOR" ? "/dashboard" : "/explore", { replace: true });
    } catch {
      setError("Failed to authenticate. Please try again.");
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center px-6">
        <span className="material-symbols-outlined text-5xl text-error mb-4">error_outline</span>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">{error}</p>
        <button
          onClick={() => navigate("/auth")}
          className="bg-primary-container text-on-primary-container font-body-md text-body-md font-bold py-3 px-6 rounded-xl"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center px-6">
      <span className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-body-md text-body-md text-on-surface-variant">Completing sign in...</p>
    </div>
  );
}
