import {
  Grid3X3,
  Image,
  MicOff,
  Moon,
  ScanLine,
  Settings,
  SwitchCamera,
  Timer,
  Zap,
  ZapOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "../camera/useCamera";
import { FILTERS, type FilterName, FilterStrip } from "./FilterStrip";
import { type CameraMode, ModeStrip } from "./ModeStrip";
import { ProControls, type ProSettings } from "./ProControls";

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  mode: CameraMode;
  filter: FilterName;
  timestamp: number;
}

type FlashMode = "off" | "auto" | "on";
type TimerMode = "off" | "3s" | "10s";
type ZoomLevel = 0.5 | 1 | 2 | 5 | 10 | 20;

interface CameraViewProps {
  photos: CapturedPhoto[];
  onPhotoCapture: (photo: CapturedPhoto) => void;
  onGalleryOpen: () => void;
  onQROpen: () => void;
}

const ZOOM_LABELS: ZoomLevel[] = [0.5, 1, 2, 5, 10, 20];

const GRID_KEYS = ["tl", "tm", "tr", "ml", "mm", "mr", "bl", "bm", "br"];

export function CameraView({
  photos,
  onPhotoCapture,
  onGalleryOpen,
  onQROpen,
}: CameraViewProps) {
  const [currentMode, setCurrentMode] = useState<CameraMode>("Photo");
  const [currentFilter, setCurrentFilter] = useState<FilterName>("Normal");
  const [flashMode, setFlashMode] = useState<FlashMode>("off");
  const [timerMode, setTimerMode] = useState<TimerMode>("off");
  const [showGrid, setShowGrid] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showShutterFlash, setShowShutterFlash] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [proSettings, setProSettings] = useState<ProSettings>({
    iso: 200,
    shutter: 5,
    whiteBalance: 5500,
    exposure: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    isActive,
    isSupported,
    error,
    isLoading,
    videoRef,
    canvasRef,
    startCamera,
    switchCamera,
  } = useCamera({ facingMode: "environment", quality: 0.92 });

  // Start camera on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    startCamera();
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Apply zoom via CSS transform
  const getZoomStyle = useCallback((): React.CSSProperties => {
    const scaleMap: Record<ZoomLevel, number> = {
      0.5: 0.75,
      1: 1,
      2: 1.8,
      5: 4.5,
      10: 9,
      20: 18,
    };
    const scale = scaleMap[zoomLevel] ?? 1;
    return {
      transform: `scale(${scale})`,
      transformOrigin: "center center",
    };
  }, [zoomLevel]);

  // Get CSS filter for current mode + user-selected filter
  const getVideoFilter = useCallback((): string => {
    let base = FILTERS[currentFilter];

    if (currentMode === "Night") {
      const nightBoost = "brightness(1.3) contrast(0.9)";
      base = base === "none" ? nightBoost : `${base} ${nightBoost}`;
    }

    // Pro mode exposure adjustment
    if (currentMode === "Pro" && proSettings.exposure !== 0) {
      const ev = 2 ** proSettings.exposure;
      const exposureFilter = `brightness(${ev.toFixed(2)})`;
      base = base === "none" ? exposureFilter : `${base} ${exposureFilter}`;
    }

    return base;
  }, [currentFilter, currentMode, proSettings.exposure]);

  function triggerShutterFlash() {
    setShowShutterFlash(true);
    setTimeout(() => setShowShutterFlash(false), 350);
  }

  async function doCapture() {
    if (!isActive || isCapturing) return;
    setIsCapturing(true);

    try {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Apply filter
      const filterVal = getVideoFilter();
      ctx.filter = filterVal === "none" ? "" : filterVal;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Portrait bokeh overlay on canvas
      if (currentMode === "Portrait") {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          canvas.height * 0.25,
          canvas.width / 2,
          canvas.height / 2,
          canvas.height * 0.7,
        );
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, "rgba(0,0,0,0.3)");
        ctx.filter = "";
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      triggerShutterFlash();

      const capturedPhoto: CapturedPhoto = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        dataUrl,
        mode: currentMode,
        filter: currentFilter,
        timestamp: Date.now(),
      };

      onPhotoCapture(capturedPhoto);
    } finally {
      setIsCapturing(false);
    }
  }

  async function handleCapture() {
    if (currentMode === "Video") {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
      return;
    }

    if (timerMode === "off") {
      await doCapture();
      return;
    }

    const seconds = timerMode === "3s" ? 3 : 10;
    let remaining = seconds;
    setCountdownValue(remaining);

    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current!);
        setCountdownValue(null);
        doCapture();
      } else {
        setCountdownValue(remaining);
      }
    }, 1000);
  }

  function startRecording() {
    if (!videoRef.current || !isActive) return;

    const stream = (
      videoRef.current as HTMLVideoElement & { srcObject: MediaStream }
    ).srcObject;
    if (!stream) return;

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `snappro_video_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      console.warn("MediaRecorder not supported or stream unavailable");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
  }

  function formatDuration(secs: number): string {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function cycleFlash() {
    setFlashMode((prev) =>
      prev === "off" ? "auto" : prev === "auto" ? "on" : "off",
    );
  }

  function cycleTimer() {
    setTimerMode((prev) =>
      prev === "off" ? "3s" : prev === "3s" ? "10s" : "off",
    );
  }

  const lastPhoto = photos.length > 0 ? photos[photos.length - 1] : null;

  if (isSupported === false) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 px-8 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.14 0 0)" }}
        >
          <ZapOff size={36} style={{ color: "oklch(var(--amber))" }} />
        </div>
        <div>
          <p className="font-outfit font-bold text-xl text-white">
            Camera Not Supported
          </p>
          <p className="font-sora text-white/50 text-sm mt-2">
            Your browser does not support camera access. Try Chrome or Safari on
            mobile.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 px-8 text-center">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.14 0 0)" }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Camera blocked"
            role="img"
          >
            <title>Camera blocked</title>
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="#b5851a"
              strokeWidth="1.5"
            />
            <path
              d="M15 9.5C14.3 8.5 13.2 8 12 8C9.8 8 8 9.8 8 12C8 14.2 9.8 16 12 16C14.2 16 16 14.2 16 12"
              stroke="#b5851a"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="16" cy="8" r="1" fill="#b5851a" />
          </svg>
        </div>
        <div>
          <p className="font-outfit font-bold text-xl text-white mb-1">
            Camera Permission Needed
          </p>
          <p className="font-sora text-white/50 text-sm leading-relaxed">
            {error.message}. Please allow camera access in your browser settings
            and refresh the page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => startCamera()}
          className="px-8 py-3.5 rounded-2xl font-outfit font-bold text-sm"
          style={{
            background: "oklch(var(--amber))",
            color: "oklch(0.07 0 0)",
            boxShadow: "0 0 20px oklch(0.72 0.18 68 / 30%)",
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Video feed */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{
            filter: getVideoFilter(),
            ...getZoomStyle(),
            transition: "transform 0.3s ease",
          }}
        />
      </div>

      {/* Portrait vignette overlay */}
      {currentMode === "Portrait" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 50% 40%, transparent 40%, rgba(0,0,0,0.5) 100%)",
          }}
        />
      )}

      {/* Night mode label */}
      {currentMode === "Night" && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full camera-glass">
          <Moon size={12} style={{ color: "oklch(0.75 0.18 280)" }} />
          <span className="font-sora text-[11px] font-semibold text-white/80">
            Night Mode
          </span>
        </div>
      )}

      {/* Rule-of-thirds grid */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: "1fr 1fr 1fr",
              gridTemplateRows: "1fr 1fr 1fr",
            }}
          >
            {GRID_KEYS.map((k) => (
              <div key={k} className="border border-white/20" />
            ))}
          </div>
        </div>
      )}

      {/* Shutter flash */}
      {showShutterFlash && (
        <div className="absolute inset-0 bg-white pointer-events-none z-50 animate-shutter-flash" />
      )}

      {/* Countdown overlay */}
      {countdownValue !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/30">
          <span
            key={countdownValue}
            className="font-outfit font-black text-[120px] text-white animate-countdown-tick"
            style={{ textShadow: "0 0 40px oklch(var(--amber))" }}
          >
            {countdownValue}
          </span>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-12 h-12 rounded-full border-2 animate-spin"
              style={{
                borderColor: "oklch(var(--amber))",
                borderTopColor: "transparent",
              }}
            />
            <span className="font-sora text-sm text-white/60">
              Starting camera...
            </span>
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full camera-glass">
          <div
            className="w-2.5 h-2.5 rounded-full animate-recording-blink"
            style={{ background: "oklch(0.60 0.22 25)" }}
          />
          <span className="font-sora text-sm font-bold text-white">
            {formatDuration(recordingDuration)}
          </span>
        </div>
      )}

      {/* Pro mode controls */}
      {currentMode === "Pro" && (
        <ProControls settings={proSettings} onChange={setProSettings} />
      )}

      {/* ── TOP BAR ─────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-10 safe-top">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          {/* Flash */}
          <button
            type="button"
            onClick={cycleFlash}
            className="flex items-center justify-center w-10 h-10 rounded-full camera-glass transition-all active:scale-95"
          >
            {flashMode === "off" && (
              <ZapOff size={18} className="text-white/70" />
            )}
            {flashMode === "auto" && (
              <span
                className="font-sora text-xs font-bold"
                style={{ color: "oklch(var(--amber))" }}
              >
                A
              </span>
            )}
            {flashMode === "on" && (
              <Zap size={18} style={{ color: "oklch(var(--amber))" }} />
            )}
          </button>

          {/* Center: timer badge */}
          <div className="flex items-center gap-2">
            {timerMode !== "off" && (
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{
                  background: "oklch(var(--amber) / 20%)",
                  border: "1px solid oklch(var(--amber) / 40%)",
                }}
              >
                <Timer size={11} style={{ color: "oklch(var(--amber))" }} />
                <span
                  className="font-sora text-[10px] font-bold"
                  style={{ color: "oklch(var(--amber))" }}
                >
                  {timerMode}
                </span>
              </div>
            )}
          </div>

          {/* Right: QR + Timer + Grid + Settings */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onQROpen}
              className="flex items-center justify-center w-10 h-10 rounded-full camera-glass transition-all active:scale-95"
              aria-label="Open QR scanner"
            >
              <ScanLine size={18} className="text-white/70" />
            </button>
            <button
              type="button"
              onClick={cycleTimer}
              className="flex items-center justify-center w-10 h-10 rounded-full camera-glass transition-all active:scale-95"
            >
              <Timer
                size={18}
                style={{
                  color:
                    timerMode !== "off"
                      ? "oklch(var(--amber))"
                      : "rgba(255,255,255,0.7)",
                }}
              />
            </button>
            <button
              type="button"
              onClick={() => setShowGrid((v) => !v)}
              className="flex items-center justify-center w-10 h-10 rounded-full camera-glass transition-all active:scale-95"
            >
              <Grid3X3
                size={18}
                style={{
                  color: showGrid
                    ? "oklch(var(--amber))"
                    : "rgba(255,255,255,0.7)",
                }}
              />
            </button>
            <button
              type="button"
              onClick={() => setShowSettings((v) => !v)}
              className="flex items-center justify-center w-10 h-10 rounded-full camera-glass transition-all active:scale-95"
            >
              <Settings size={18} className="text-white/70" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div
          className="absolute top-20 right-4 z-30 rounded-2xl p-4 w-52 animate-fade-in"
          style={{
            background: "oklch(0.12 0 0 / 95%)",
            border: "1px solid oklch(0.25 0 0)",
          }}
        >
          <p className="font-sora text-xs text-white/40 uppercase tracking-widest mb-3">
            Settings
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-sora text-sm text-white/80">
                Grid Lines
              </span>
              <button
                type="button"
                onClick={() => setShowGrid((v) => !v)}
                className="w-10 h-6 rounded-full transition-all"
                style={{
                  background: showGrid
                    ? "oklch(var(--amber))"
                    : "rgba(255,255,255,0.2)",
                }}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${showGrid ? "translate-x-4" : "translate-x-0"}`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sora text-sm text-white/80">
                Mute Audio
              </span>
              <button
                type="button"
                onClick={() => setIsMuted((v) => !v)}
                className="w-10 h-6 rounded-full transition-all"
                style={{
                  background: isMuted
                    ? "oklch(var(--amber))"
                    : "rgba(255,255,255,0.2)",
                }}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${isMuted ? "translate-x-4" : "translate-x-0"}`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM CONTROLS ─────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 flex flex-col"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)",
        }}
      >
        {/* Zoom strip */}
        <div className="flex items-center justify-center gap-1.5 mb-3 px-4 overflow-x-auto no-scrollbar">
          {ZOOM_LABELS.map((z) => (
            <button
              type="button"
              key={z}
              onClick={() => setZoomLevel(z)}
              className={`flex-shrink-0 px-3 py-1 rounded-full font-sora text-xs font-bold transition-all duration-200 ${
                zoomLevel === z ? "scale-110" : ""
              }`}
              style={{
                background:
                  zoomLevel === z
                    ? "oklch(var(--amber) / 90%)"
                    : "oklch(0.18 0 0 / 80%)",
                color:
                  zoomLevel === z ? "oklch(0.07 0 0)" : "rgba(255,255,255,0.7)",
                boxShadow:
                  zoomLevel === z
                    ? "0 0 10px oklch(0.72 0.18 68 / 40%)"
                    : "none",
              }}
            >
              {z}x
            </button>
          ))}
        </div>

        {/* Filter strip */}
        <div className="mb-2">
          <FilterStrip
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
          />
        </div>

        {/* Mode strip */}
        <div className="mb-4">
          <ModeStrip currentMode={currentMode} onModeChange={setCurrentMode} />
        </div>

        {/* Capture row */}
        <div className="flex items-center justify-between px-8 mb-2">
          {/* Gallery thumb */}
          <button
            type="button"
            onClick={onGalleryOpen}
            className="w-14 h-14 rounded-xl overflow-hidden border-2 transition-all active:scale-95"
            style={{ borderColor: "rgba(255,255,255,0.3)" }}
          >
            {lastPhoto ? (
              <img
                src={lastPhoto.dataUrl}
                alt="Open gallery"
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "oklch(0.18 0 0)" }}
              >
                <Image size={20} className="text-white/40" />
              </div>
            )}
          </button>

          {/* Capture button */}
          <button
            type="button"
            onClick={handleCapture}
            disabled={!isActive || isCapturing || countdownValue !== null}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 disabled:opacity-50 ${
              isRecording ? "" : "animate-capture-pulse"
            }`}
            style={{
              background: isRecording
                ? "oklch(0.60 0.22 25)"
                : "oklch(var(--amber))",
              boxShadow: isRecording
                ? "0 0 0 3px oklch(0.60 0.22 25), 0 0 20px oklch(0.60 0.22 25 / 40%)"
                : "0 0 0 3px oklch(var(--amber)), 0 0 0 7px oklch(var(--amber) / 30%), 0 0 30px oklch(var(--amber) / 40%)",
            }}
          >
            {isRecording ? (
              <div className="w-8 h-8 rounded bg-white" />
            ) : currentMode === "Video" ? (
              <div
                className="w-6 h-6 rounded-full"
                style={{ background: "oklch(0.60 0.22 25)" }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-4 border-white/20" />
            )}
          </button>

          {/* Flip camera */}
          <button
            type="button"
            onClick={() => switchCamera()}
            className="w-14 h-14 rounded-full flex items-center justify-center camera-glass transition-all active:scale-90"
          >
            <SwitchCamera size={22} className="text-white" />
          </button>
        </div>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Mute indicator */}
      {isMuted && (
        <div className="absolute top-20 right-4 z-20">
          <MicOff size={16} className="text-white/40" />
        </div>
      )}
    </div>
  );
}
