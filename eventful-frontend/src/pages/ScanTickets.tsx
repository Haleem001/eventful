import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import BottomNav from "../components/BottomNav";
import api from "../lib/api";
import type { Ticket } from "../lib/types";

const SCAN_INTERVAL_MS = 350;

type NativeBarcodeDetector = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

export default function ScanTickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<NativeBarcodeDetector | null>(null);
  const intervalRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [camError, setCamError] = useState("");

  const stopCamera = useCallback(async () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }

    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    detectorRef.current = null;
    setCameraActive(false);
    setStarting(false);
    setTorchOn(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCamera().catch(() => {});
    };
  }, [stopCamera]);

  useEffect(() => {
    if (!user) {
      toast("Sign in as a Creator to scan tickets", "error");
    } else if (user.role !== "CREATOR") {
      toast("Access denied: Creator role required", "error");
    }
  }, [user, toast]);

  const verifyTicket = useCallback(
    async (id: string) => {
      setScanning(true);
      setError("");
      try {
        const { data } = await api.patch<Ticket>(`/tickets/${id}/verify`);
        setResult(data);
        toast("Ticket verified successfully", "success");
      } catch (err: any) {
        const msg = err.friendlyMessage;
        if (msg?.includes("already")) {
          setError("Ticket already verified");
          toast("Ticket already verified", "error");
        } else if (msg?.includes("not found")) {
          setError("Ticket not found");
          toast("Ticket not found", "error");
        } else {
          const display = msg || "Verification failed";
          setError(display);
          toast(display, "error");
        }
      } finally {
        setScanning(false);
      }
    },
    [toast],
  );

  const detectLoop = useCallback(async () => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.readyState < 2 || scanning) return;

    try {
      const codes = await detector.detect(video);
      const first = codes[0]?.rawValue;
      if (!first) return;

      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
      }

      try {
        const payload = JSON.parse(first);
        if (payload?.ticketId) {
          await verifyTicket(payload.ticketId);
          return;
        }
      } catch {
        if (first.length >= 8) {
          await verifyTicket(first);
          return;
        }
      }

      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = true;
        });
      }
      intervalRef.current = window.setInterval(() => {
        detectLoop().catch(() => {});
      }, SCAN_INTERVAL_MS);
    } catch {}
  }, [scanning, verifyTicket]);

  const startCamera = useCallback(async () => {
    setCamError("");
    setError("");
    setStarting(true);
    setCameraActive(true);

    try {
      if (!window.isSecureContext) {
        throw new Error("Camera access requires HTTPS.");
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support camera access.");
      }

      const detector = "BarcodeDetector" in window ? new (window as unknown as { BarcodeDetector: new (_options: { formats: string[] }) => NativeBarcodeDetector }).BarcodeDetector({ formats: ["qr_code"] }) : null;
      if (!detector) {
        throw new Error("QR scanning is not supported in this browser. Use the manual verifier.");
      }

      detectorRef.current = detector;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error("Camera preview is not available.");
      }

      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;
      video.controls = false;

      await new Promise<void>((resolve) => {
        if (video.readyState >= 1) {
          resolve();
          return;
        }
        video.onloadedmetadata = () => resolve();
      });

      await video.play().catch(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
        await video.play();
      });

      intervalRef.current = window.setInterval(() => {
        detectLoop().catch(() => {});
      }, SCAN_INTERVAL_MS);
    } catch (err: any) {
      const msg = err?.message || err?.toString() || "Unknown error";
      setCamError(`Camera error: ${msg}`);
      await stopCamera();
    } finally {
      setStarting(false);
    }
  }, [detectLoop, stopCamera]);

  const toggleTorch = useCallback(async () => {
    try {
      const track = streamRef.current?.getVideoTracks?.()[0];
      const capabilities = track?.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean } | undefined;
      if (!track || !capabilities?.torch) return;
      await track.applyConstraints({
        advanced: [{ torch: !torchOn }] as any,
      });
      setTorchOn((prev) => !prev);
    } catch {}
  }, [torchOn]);

  const handleManualVerify = async () => {
    const id = ticketId.trim();
    if (!id || id.length < 8) {
      setError("Enter a valid ticket ID or reference");
      return;
    }
    await verifyTicket(id);
  };

  const handleScanNext = () => {
    setResult(null);
    setError("");
    if (streamRef.current) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
      intervalRef.current = window.setInterval(() => {
        detectLoop().catch(() => {});
      }, SCAN_INTERVAL_MS);
    }
  };

  const handleCloseResult = () => {
    if (result) {
      handleScanNext();
    }
  };

  const showScannerFrame = cameraActive || starting || Boolean(camError);

  if (!user || user.role !== "CREATOR") {
    return (
      <div className="min-h-screen overflow-y-auto flex flex-col bg-surface text-on-surface items-center justify-center gap-4 px-6">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">lock</span>
        <p className="font-body-md text-body-md text-on-surface-variant text-center">Creator access only.</p>
        <button onClick={() => navigate("/auth")} className="bg-primary text-on-primary px-6 py-2 rounded-full">
          Switch Account
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md select-none flex flex-col">
      <header className="bg-surface/80 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-outline-variant/30 flex justify-between items-center px-container-margin py-stack-sm h-16">
        <button
          onClick={() => navigate(-1)}
          className="text-on-surface-variant hover:opacity-80 transition-opacity p-2 rounded-full"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md-mobile font-black text-primary tracking-tight">Scanner</h1>
        <div className="w-10" />
      </header>

      <main className="relative flex-1 mt-16 overflow-y-auto flex flex-col items-center justify-center py-8">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-surface-container-highest via-surface-container to-surface-container-lowest" />

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6 px-6">
          <div
            className={`${showScannerFrame ? "w-full max-w-[350px] aspect-square relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-[0_0_30px_rgba(78,222,163,0.15)]" : "hidden"}`}
          >
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover bg-black"
              autoPlay
              muted
              playsInline
            />
            {showScannerFrame && (
              <>
                <div className="absolute inset-0 pointer-events-none rounded-2xl ring-2 ring-primary/50 z-10" />
                <div className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px_rgba(78,222,163,1)] scan-line z-20" />
              </>
            )}
          </div>

          {!cameraActive ? (
            <div className="w-full space-y-4">
              <div className="w-48 h-48 mx-auto relative">
                <div
                  className="absolute top-0 left-0 w-10 h-10 border-t-3 border-l-3 border-primary rounded-tl-lg"
                  style={{ boxShadow: "inset 3px 3px 8px rgba(78,222,163,0.15), -3px -3px 10px rgba(78,222,163,0.2)" }}
                />
                <div
                  className="absolute top-0 right-0 w-10 h-10 border-t-3 border-r-3 border-primary rounded-tr-lg"
                  style={{ boxShadow: "inset -3px 3px 8px rgba(78,222,163,0.15), 3px -3px 10px rgba(78,222,163,0.2)" }}
                />
                <div
                  className="absolute bottom-0 left-0 w-10 h-10 border-b-3 border-l-3 border-primary rounded-bl-lg"
                  style={{ boxShadow: "inset 3px -3px 8px rgba(78,222,163,0.15), -3px 3px 10px rgba(78,222,163,0.2)" }}
                />
                <div
                  className="absolute bottom-0 right-0 w-10 h-10 border-b-3 border-r-3 border-primary rounded-br-lg"
                  style={{ boxShadow: "inset -3px -3px 8px rgba(78,222,163,0.15), 3px 3px 10px rgba(78,222,163,0.2)" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-primary/30">qr_code_scanner</span>
                </div>
                <div className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(78,222,163,1)] scan-line z-20" />
              </div>

              <button
                onClick={startCamera}
                disabled={starting}
                className="w-full bg-primary text-on-primary font-label-sm text-label-sm py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ boxShadow: "0 0 20px rgba(78,222,163,0.2)" }}
              >
                {starting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    Starting camera...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                    Scan QR Code
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              <p className="font-label-sm text-label-sm text-on-surface-variant text-center">Point camera at a QR code</p>

              <div className="flex gap-4">
                <button
                  onClick={toggleTorch}
                  className="bg-surface-container/80 backdrop-blur-xl border border-outline-variant/30 p-4 rounded-full text-on-surface shadow-lg hover:text-primary transition-colors active:scale-90"
                >
                  <span className="material-symbols-outlined">{torchOn ? "flashlight_off" : "flashlight_on"}</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-error/20 border border-error/40 p-4 rounded-full text-error shadow-lg hover:bg-error/30 transition-colors active:scale-90"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {error && (
                <div className="bg-error-container/20 border border-error/30 rounded-xl px-4 py-3 flex items-center gap-2 w-full">
                  <span className="material-symbols-outlined text-error text-sm">error_outline</span>
                  <p className="font-label-sm text-label-sm text-error">{error}</p>
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-outline-variant/30" />
            <span className="font-label-sm text-label-sm text-on-surface-variant">or enter manually</span>
            <div className="flex-1 h-px bg-outline-variant/30" />
          </div>

          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={ticketId}
              onChange={(e) => {
                setTicketId(e.target.value);
                setError("");
              }}
              placeholder="Ticket ID or reference"
              className="flex-1 min-w-0 bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-body-md text-body-md"
            />
            <button
              onClick={handleManualVerify}
              disabled={scanning || !ticketId.trim()}
              className="bg-on-surface text-surface font-label-sm text-label-sm px-5 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 shrink-0"
            >
              {scanning ? <span className="w-4 h-4 border-2 border-surface border-t-transparent rounded-full animate-spin" /> : "Verify"}
            </button>
          </div>

          {camError && (
            <div className="bg-error-container/20 border border-error/30 rounded-xl px-4 py-3 flex items-center gap-2 w-full">
              <span className="material-symbols-outlined text-error text-sm">error_outline</span>
              <p className="font-label-sm text-label-sm text-error">{camError}</p>
            </div>
          )}
        </div>
      </main>

      {result && (
        <div
          className="fixed inset-0 z-[100] bg-surface/80 backdrop-blur-lg flex items-center justify-center px-container-margin transition-opacity duration-300"
          onClick={handleCloseResult}
        >
          <div
            className="bg-surface-container border border-outline-variant/50 rounded-2xl p-8 flex flex-col items-center text-center w-full max-w-sm shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <div className="w-20 h-20 bg-primary-container/20 rounded-full flex items-center justify-center mb-6 relative z-10">
              <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <h2 className="font-headline-md text-headline-md-mobile text-on-surface mb-2 relative z-10">Valid Ticket</h2>
            <div className="bg-surface-container-low w-full rounded-xl p-4 my-6 border border-outline-variant/30 relative z-10">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Ticket Reference</p>
              <p className="font-body-lg text-body-lg text-on-surface font-semibold mb-3 font-mono tracking-wide">
                {result.reference.toUpperCase()}
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                <span className="bg-secondary-container/50 text-secondary border border-secondary/20 px-3 py-1 rounded-full font-label-sm text-[10px]">
                  {result.event?.title || `Event ${result.eventId.slice(0, 6)}`}
                </span>
                <span
                  className={`px-3 py-1 rounded-full font-label-sm text-[10px] ${
                    result.isScanned ? "bg-warning/10 text-warning border border-warning/20" : "bg-primary/10 text-primary border border-primary/20"
                  }`}
                >
                  {result.isScanned ? "Already Used" : "Valid"}
                </span>
              </div>
            </div>
            <button
              onClick={handleScanNext}
              className="w-full bg-primary text-on-primary font-headline-md text-[16px] py-4 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all relative z-10"
            >
              Scan Next
            </button>
          </div>
        </div>
      )}

      {scanning && (
        <div className="fixed inset-0 z-[90] bg-surface/60 backdrop-blur-sm flex items-center justify-center">
          <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <BottomNav />
    </div>
  );
}
