import {
  Check,
  ChevronLeft,
  Copy,
  ExternalLink,
  FlipHorizontal,
  ScanLine,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useQRScanner } from "../qr-code/useQRScanner";

interface QRScannerViewProps {
  onBack: () => void;
}

function isUrl(text: string): boolean {
  return /^https?:\/\//i.test(text);
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function QRScannerView({ onBack }: QRScannerViewProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error,
    isLoading,
    jsQRLoaded,
    startScanning,
    stopScanning,
    switchCamera,
    clearResults,
    retry,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 100,
    maxResults: 5,
  });

  // Auto-start on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const handleCopy = useCallback(async (text: string, ts: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(ts);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }, []);

  const latestResult = qrResults[0] ?? null;

  // Not supported
  if (isSupported === false) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-6 px-8 text-center"
        style={{ background: "#050505" }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "oklch(0.14 0 0)" }}
        >
          <ScanLine size={36} style={{ color: "oklch(var(--amber))" }} />
        </div>
        <div>
          <p className="font-outfit font-bold text-xl text-white">
            Camera Not Supported
          </p>
          <p className="font-sora text-white/50 text-sm mt-2 leading-relaxed">
            Your browser does not support camera access. Try Chrome or Safari on
            mobile.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-3.5 rounded-2xl font-outfit font-bold text-sm"
          style={{
            background: "oklch(var(--amber))",
            color: "oklch(0.07 0 0)",
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // Camera error
  if (error) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-6 px-8 text-center"
        style={{ background: "#050505" }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "oklch(0.14 0 0)" }}
        >
          <X size={36} style={{ color: "oklch(0.60 0.22 25)" }} />
        </div>
        <div>
          <p className="font-outfit font-bold text-xl text-white">
            Camera Permission Needed
          </p>
          <p className="font-sora text-white/50 text-sm mt-2 leading-relaxed">
            {error.message}. Please allow camera access and try again.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={retry}
            className="px-8 py-3.5 rounded-2xl font-outfit font-bold text-sm"
            style={{
              background: "oklch(var(--amber))",
              color: "oklch(0.07 0 0)",
            }}
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3.5 rounded-2xl font-outfit font-semibold text-sm"
            style={{
              background: "oklch(0.18 0 0)",
              color: "oklch(0.75 0 0)",
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: "#050505" }}
    >
      {/* Video feed - full screen */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay with cutout effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "rgba(0,0,0,0.55)",
        }}
      />

      {/* ── VIEWFINDER FRAME ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-start pt-28 pointer-events-none">
        {/* Square viewfinder */}
        <div
          className="relative"
          style={{
            width: "min(72vw, 280px)",
            height: "min(72vw, 280px)",
          }}
        >
          {/* Clear center (remove overlay) */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            }}
          />

          {/* Corner brackets — top-left */}
          <div
            className="absolute top-0 left-0 animate-qr-corner-pulse"
            style={{ width: 32, height: 32 }}
          >
            <div
              className="absolute top-0 left-0 w-8 h-1 rounded-full"
              style={{ background: "oklch(var(--amber))" }}
            />
            <div
              className="absolute top-0 left-0 w-1 h-8 rounded-full"
              style={{ background: "oklch(var(--amber))" }}
            />
          </div>

          {/* Corner brackets — top-right */}
          <div
            className="absolute top-0 right-0 animate-qr-corner-pulse"
            style={{ width: 32, height: 32 }}
          >
            <div
              className="absolute top-0 right-0 w-8 h-1 rounded-full"
              style={{ background: "oklch(var(--amber))" }}
            />
            <div
              className="absolute top-0 right-0 w-1 h-8 rounded-full"
              style={{ background: "oklch(var(--amber))" }}
            />
          </div>

          {/* Corner brackets — bottom-left */}
          <div
            className="absolute bottom-0 left-0 animate-qr-corner-pulse"
            style={{ width: 32, height: 32 }}
          >
            <div
              className="absolute bottom-0 left-0 w-8 h-1 rounded-full"
              style={{ background: "oklch(var(--amber))" }}
            />
            <div
              className="absolute bottom-0 left-0 w-1 h-8 rounded-full"
              style={{ background: "oklch(var(--amber))" }}
            />
          </div>

          {/* Corner brackets — bottom-right */}
          <div
            className="absolute bottom-0 right-0 animate-qr-corner-pulse"
            style={{ width: 32, height: 32 }}
          >
            <div
              className="absolute bottom-0 right-0 w-8 h-1 rounded-full"
              style={{ background: "oklch(var(--amber))" }}
            />
            <div
              className="absolute bottom-0 right-0 w-1 h-8 rounded-full"
              style={{ background: "oklch(var(--amber))" }}
            />
          </div>

          {/* Scan line */}
          {isScanning && isActive && (
            <div
              className="absolute left-2 right-2 h-0.5 animate-qr-scan-line rounded-full"
              style={{
                background:
                  "linear-gradient(to right, transparent, oklch(var(--amber)), transparent)",
                boxShadow: "0 0 8px 2px oklch(var(--amber) / 60%)",
              }}
            />
          )}
        </div>

        {/* Hint text */}
        <p className="font-sora text-sm text-white/60 mt-5 text-center px-8">
          {!jsQRLoaded
            ? "Loading scanner..."
            : isLoading
              ? "Starting camera..."
              : isScanning && isActive
                ? "Point camera at a QR code"
                : "Tap scan to start"}
        </p>
      </div>

      {/* Loading overlay */}
      {(isLoading || !jsQRLoaded) && (
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
              {!jsQRLoaded ? "Loading QR engine..." : "Starting camera..."}
            </span>
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-top">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full camera-glass transition-all active:scale-95"
            aria-label="Go back"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-2">
            <ScanLine size={16} style={{ color: "oklch(var(--amber))" }} />
            <span className="font-outfit font-bold text-white text-base">
              QR Scanner
            </span>
          </div>

          {/* Switch camera */}
          <button
            type="button"
            onClick={() => switchCamera()}
            className="flex items-center justify-center w-10 h-10 rounded-full camera-glass transition-all active:scale-95"
            aria-label="Switch camera"
          >
            <FlipHorizontal size={18} className="text-white/80" />
          </button>
        </div>
      </div>

      {/* ── BOTTOM PANEL ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex flex-col"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.85) 70%, transparent 100%)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 20px)",
        }}
      >
        {/* Latest result */}
        {latestResult && (
          <div
            className="mx-4 mb-3 rounded-2xl overflow-hidden animate-qr-result-pop"
            style={{
              background: "oklch(0.12 0 0 / 95%)",
              border: "1px solid oklch(var(--amber) / 30%)",
            }}
          >
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <span
                className="font-sora text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "oklch(var(--amber))" }}
              >
                Latest Result
              </span>
              <span className="font-sora text-[10px] text-white/40">
                {formatTime(latestResult.timestamp)}
              </span>
            </div>
            <div className="px-4 pb-1">
              <p
                className="font-outfit text-sm text-white/90 leading-snug break-all line-clamp-2"
                title={latestResult.data}
              >
                {latestResult.data}
              </p>
            </div>
            <div className="px-3 pb-3 flex gap-2 mt-1">
              <button
                type="button"
                onClick={() =>
                  handleCopy(latestResult.data, latestResult.timestamp)
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-sora text-xs font-semibold transition-all active:scale-95"
                style={{
                  background:
                    copiedId === latestResult.timestamp
                      ? "oklch(0.55 0.18 145 / 25%)"
                      : "oklch(0.20 0 0)",
                  color:
                    copiedId === latestResult.timestamp
                      ? "oklch(0.75 0.18 145)"
                      : "rgba(255,255,255,0.75)",
                  border: `1px solid ${copiedId === latestResult.timestamp ? "oklch(0.55 0.18 145 / 40%)" : "oklch(0.28 0 0)"}`,
                }}
              >
                {copiedId === latestResult.timestamp ? (
                  <Check size={12} />
                ) : (
                  <Copy size={12} />
                )}
                {copiedId === latestResult.timestamp ? "Copied!" : "Copy"}
              </button>
              {isUrl(latestResult.data) && (
                <a
                  href={latestResult.data}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-sora text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: "oklch(var(--amber) / 20%)",
                    color: "oklch(var(--amber))",
                    border: "1px solid oklch(var(--amber) / 35%)",
                  }}
                >
                  <ExternalLink size={12} />
                  Open
                </a>
              )}
            </div>
          </div>
        )}

        {/* Recent scans list */}
        {qrResults.length > 1 && (
          <div className="mx-4 mb-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="font-sora text-[10px] font-semibold uppercase tracking-widest text-white/40">
                Recent ({qrResults.length - 1})
              </span>
              <button
                type="button"
                onClick={clearResults}
                className="flex items-center gap-1 font-sora text-[10px] text-white/35 transition-all active:scale-95 hover:text-white/60"
              >
                <Trash2 size={10} />
                Clear all
              </button>
            </div>
            <div
              className="rounded-xl overflow-hidden overflow-y-auto max-h-32 scrollbar-hide"
              style={{
                background: "oklch(0.10 0 0 / 90%)",
                border: "1px solid oklch(0.22 0 0)",
              }}
            >
              {qrResults.slice(1).map((result, i) => (
                <div
                  key={result.timestamp}
                  className="flex items-center gap-3 px-3 py-2 transition-all"
                  style={{
                    borderBottom:
                      i < qrResults.length - 2
                        ? "1px solid oklch(0.18 0 0)"
                        : "none",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-outfit text-xs text-white/70 truncate">
                      {result.data}
                    </p>
                    <p className="font-sora text-[9px] text-white/30 mt-0.5">
                      {formatTime(result.timestamp)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.data, result.timestamp)}
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                    style={{
                      background:
                        copiedId === result.timestamp
                          ? "oklch(0.55 0.18 145 / 20%)"
                          : "oklch(0.18 0 0)",
                    }}
                    aria-label="Copy"
                  >
                    {copiedId === result.timestamp ? (
                      <Check
                        size={11}
                        style={{ color: "oklch(0.75 0.18 145)" }}
                      />
                    ) : (
                      <Copy size={11} className="text-white/50" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scan / Stop buttons */}
        <div className="flex items-center justify-center gap-4 px-8 pt-1 pb-2">
          {!isScanning ? (
            <button
              type="button"
              onClick={() => startScanning()}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full font-outfit font-bold text-sm transition-all active:scale-95"
              style={{
                background: "oklch(var(--amber))",
                color: "oklch(0.07 0 0)",
                boxShadow: "0 0 20px oklch(var(--amber) / 30%)",
              }}
            >
              <ScanLine size={16} />
              Start Scanning
            </button>
          ) : (
            <button
              type="button"
              onClick={() => stopScanning()}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full font-outfit font-bold text-sm transition-all active:scale-95"
              style={{
                background: "oklch(0.18 0 0)",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid oklch(0.28 0 0)",
              }}
            >
              <X size={16} />
              Stop
            </button>
          )}
          {qrResults.length > 0 && (
            <button
              type="button"
              onClick={clearResults}
              className="flex items-center gap-2 px-5 py-3.5 rounded-full font-outfit font-semibold text-sm transition-all active:scale-95"
              style={{
                background: "oklch(0.14 0 0)",
                color: "rgba(255,255,255,0.5)",
                border: "1px solid oklch(0.22 0 0)",
              }}
            >
              <Trash2 size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
