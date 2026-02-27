import { useRef } from "react";

export type FilterName =
  | "Normal"
  | "Vivid"
  | "Dramatic"
  | "Noir"
  | "Fade"
  | "Chrome"
  | "Cool"
  | "Warm"
  | "Vintage"
  | "Sepia"
  | "B&W"
  | "Sharpen";

export const FILTERS: Record<FilterName, string> = {
  Normal: "none",
  Vivid: "saturate(1.8) contrast(1.1)",
  Dramatic: "contrast(1.4) saturate(0.8) brightness(0.9)",
  Noir: "grayscale(1) contrast(1.3)",
  Fade: "contrast(0.85) brightness(1.1) saturate(0.7)",
  Chrome: "saturate(1.4) brightness(1.1) contrast(1.1) hue-rotate(5deg)",
  Cool: "hue-rotate(20deg) saturate(1.1)",
  Warm: "sepia(0.3) saturate(1.4) hue-rotate(-10deg)",
  Vintage: "sepia(0.5) contrast(0.9) brightness(1.05) saturate(0.8)",
  Sepia: "sepia(1)",
  "B&W": "grayscale(1)",
  Sharpen: "contrast(1.2) brightness(1.05)",
};

const FILTER_NAMES = Object.keys(FILTERS) as FilterName[];

interface FilterStripProps {
  currentFilter: FilterName;
  onFilterChange: (filter: FilterName) => void;
  previewSrc?: string;
}

export function FilterStrip({
  currentFilter,
  onFilterChange,
  previewSrc,
}: FilterStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-2"
      >
        {FILTER_NAMES.map((name) => {
          const isActive = currentFilter === name;
          return (
            <button
              type="button"
              key={name}
              onClick={() => onFilterChange(name)}
              className="flex-none flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  isActive
                    ? "border-amber scale-105 shadow-amber"
                    : "border-transparent opacity-70 group-hover:opacity-90 group-hover:border-white/20"
                }`}
                style={{
                  boxShadow: isActive
                    ? "0 0 12px oklch(0.72 0.18 68 / 50%)"
                    : undefined,
                }}
              >
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt={name}
                    className="w-full h-full object-cover"
                    style={{ filter: FILTERS[name] }}
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{
                      filter: FILTERS[name],
                      background:
                        "linear-gradient(135deg, oklch(0.45 0.15 200), oklch(0.65 0.20 145), oklch(0.72 0.18 68))",
                    }}
                  />
                )}
              </div>
              <span
                className={`font-sora text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                  isActive ? "text-amber" : "text-white/60"
                }`}
              >
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
