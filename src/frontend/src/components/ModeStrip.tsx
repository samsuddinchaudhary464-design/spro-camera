import {
  Aperture,
  Camera,
  Moon,
  ScanLine,
  SlidersHorizontal,
  Timer,
  Video,
  Zap,
} from "lucide-react";
import { useEffect, useRef } from "react";

export type CameraMode =
  | "Photo"
  | "Video"
  | "Portrait"
  | "Night"
  | "Panorama"
  | "Slow-Mo"
  | "Time-lapse"
  | "Pro";

const MODE_ICONS: Record<CameraMode, React.ReactNode> = {
  Photo: <Camera size={14} />,
  Video: <Video size={14} />,
  Portrait: <Aperture size={14} />,
  Night: <Moon size={14} />,
  Panorama: <ScanLine size={14} />,
  "Slow-Mo": <Zap size={14} />,
  "Time-lapse": <Timer size={14} />,
  Pro: <SlidersHorizontal size={14} />,
};

const MODES: CameraMode[] = [
  "Photo",
  "Video",
  "Portrait",
  "Night",
  "Panorama",
  "Slow-Mo",
  "Time-lapse",
  "Pro",
];

interface ModeStripProps {
  currentMode: CameraMode;
  onModeChange: (mode: CameraMode) => void;
}

export function ModeStrip({ currentMode, onModeChange }: ModeStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: currentMode change should trigger scroll
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentMode]);

  return (
    <div className="w-full">
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-1"
      >
        {MODES.map((mode) => {
          const isActive = currentMode === mode;
          return (
            <button
              type="button"
              key={mode}
              ref={isActive ? activeRef : undefined}
              onClick={() => onModeChange(mode)}
              className={`flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sora text-[11px] font-semibold tracking-wide transition-all duration-200 ${
                isActive
                  ? "bg-amber text-black"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: "oklch(var(--amber))",
                      boxShadow: "0 0 12px oklch(0.72 0.18 68 / 40%)",
                    }
                  : undefined
              }
            >
              <span className={isActive ? "text-black" : "text-white/60"}>
                {MODE_ICONS[mode]}
              </span>
              {mode}
            </button>
          );
        })}
      </div>
    </div>
  );
}
