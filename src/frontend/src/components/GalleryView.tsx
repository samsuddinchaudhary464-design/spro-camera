import { ArrowLeft, Camera } from "lucide-react";
import type { CapturedPhoto } from "./CameraView";

interface GalleryViewProps {
  photos: CapturedPhoto[];
  onBack: () => void;
  onSelect: (photo: CapturedPhoto) => void;
}

const GRID_CELLS = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];

export function GalleryView({ photos, onBack, onSelect }: GalleryViewProps) {
  return (
    <div
      className="w-full h-full flex flex-col animate-fade-in"
      style={{ background: "oklch(0.07 0 0)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pt-12 pb-4 safe-top"
        style={{ background: "oklch(0.08 0 0)" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-white/10 active:bg-white/20"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="font-outfit font-bold text-lg text-white">Gallery</h1>
          <p className="font-sora text-xs text-white/40">
            {photos.length} photos
          </p>
        </div>
      </div>

      {/* Content */}
      {photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.14 0 0)" }}
          >
            <Camera size={36} style={{ color: "oklch(var(--amber))" }} />
          </div>
          <div className="text-center">
            <p className="font-outfit font-semibold text-white text-lg">
              No photos yet
            </p>
            <p className="font-sora text-white/40 text-sm mt-1">
              Tap the capture button to take your first shot
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-1">
          <div className="grid grid-cols-3 gap-0.5">
            {[...photos].reverse().map((photo) => (
              <button
                type="button"
                key={photo.id}
                onClick={() => onSelect(photo)}
                className="relative aspect-square overflow-hidden group"
              >
                <img
                  src={photo.dataUrl}
                  alt={`${photo.mode} shot with ${photo.filter} filter`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-sora text-[8px] font-bold tracking-wide px-1 py-0.5 rounded"
                      style={{
                        background: "oklch(var(--amber) / 80%)",
                        color: "oklch(0.08 0 0)",
                      }}
                    >
                      {photo.mode.toUpperCase()}
                    </span>
                    <span className="font-sora text-[8px] text-white/60">
                      {photo.filter}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="px-4 py-3 text-center safe-bottom"
        style={{ background: "oklch(0.08 0 0)" }}
      >
        <p className="font-sora text-[10px] text-white/20">
          {new Date().getFullYear()} &middot; Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

export { GRID_CELLS };
