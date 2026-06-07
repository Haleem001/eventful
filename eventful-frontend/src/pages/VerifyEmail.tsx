import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/api";

type Status = "loading" | "success" | "error";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data?.message || "Email verified!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err?.response?.data?.message || "Verification failed.");
      });
  }, [token, email]);

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center px-container-margin">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-surface-container/60 flex items-center justify-center text-on-surface hover:opacity-80 transition-opacity active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
        <div className="text-center">
        {status === "loading" && (
          <>
            <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block mb-4" />
            <p className="font-body-md text-body-md text-on-surface-variant">Verifying your email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <span className="material-symbols-outlined text-5xl text-primary mb-4">mark_email_read</span>
            <p className="font-headline-md text-headline-md-mobile text-on-surface mb-2">Email verified!</p>
            <p className="font-body-md text-sm text-on-surface-variant mb-6">{message}</p>
            <button
              onClick={() => navigate("/auth")}
              className="bg-primary-container text-on-primary-container font-body-md text-body-md font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
            >
              Sign In
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <span className="material-symbols-outlined text-5xl text-error mb-4">error_outline</span>
            <p className="font-headline-md text-headline-md-mobile text-on-surface mb-2">Verification failed</p>
            <p className="font-body-md text-sm text-on-surface-variant mb-6">{message}</p>
            <button
              onClick={() => navigate("/auth")}
              className="text-primary font-label-sm text-label-sm hover:underline"
            >
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  </div>
  );
}
