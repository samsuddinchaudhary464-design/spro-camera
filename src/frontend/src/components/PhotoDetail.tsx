import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Check, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import type { CapturedPhoto } from "./CameraView";
import { FILTERS, type FilterName, FilterStrip } from "./FilterStrip";

interface PhotoDetailProps {
  photo: CapturedPhoto;
  onBack: () => void;
  onDelete: (id: string) => void;
  onSave: (updated: CapturedPhoto) => void;
}

export function PhotoDetail({
  photo,
  onBack,
  onDelete,
  onSave,
}: PhotoDetailProps) {
  const [activeFilter, setActiveFilter] = useState<FilterName>(
    photo.filter as FilterName,
  );
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saved, setSaved] = useState(false);

  const combinedFilter = [
    FILTERS[activeFilter] === "none" ? "" : FILTERS[activeFilter],
    `brightness(${brightness / 100})`,
    `contrast(${contrast / 100})`,
  ]
    .filter(Boolean)
    .join(" ");

  function handleSave() {
    onSave({ ...photo, filter: activeFilter });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDownload() {
    const a = document.createElement("a");
    a.href = photo.dataUrl;
    a.download = `snappro_${photo.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleDelete() {
    if (confirm("Delete this shot?")) {
      onDelete(photo.id);
      onBack();
    }
  }

  return (
    <div
      className="w-full h-full flex flex-col animate-fade-in"
      style={{ background: "#000" }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pb-4 bg-gradient-to-b from-black/80 to-transparent safe-top">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-full camera-glass transition-colors hover:bg-white/20 active:bg-white/30"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center justify-center w-9 h-9 rounded-full camera-glass transition-colors hover:bg-red-500/20 active:bg-red-500/30"
          >
            <Trash2 size={16} style={{ color: "oklch(0.60 0.22 25)" }} />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center justify-center w-9 h-9 rounded-full camera-glass transition-colors hover:bg-white/20 active:bg-white/30"
          >
            <Download size={16} className="text-white" />
          </button>
        </div>
      </div>

      {/* Photo */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <img
          src={photo.dataUrl}
          alt={`${photo.mode} shot with ${photo.filter} filter`}
          className="w-full h-full object-contain animate-zoom-in-photo"
          style={{ filter: combinedFilter }}
        />
      </div>

      {/* Edit Panel */}
      <div
        className="animate-slide-up"
        style={{ background: "oklch(0.09 0 0)" }}
      >
        {/* Filter strip */}
        <div className="pt-3">
          <p className="font-sora text-[10px] text-white/40 uppercase tracking-widest px-5 mb-1">
            Filters
          </p>
          <FilterStrip
            currentFilter={activeFilter}
            onFilterChange={setActiveFilter}
            previewSrc={photo.dataUrl}
          />
        </div>

        {/* Brightness / Contrast */}
        <div className="px-5 pb-4 pt-2 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="font-sora text-[10px] text-white/40 uppercase tracking-widest w-20">
              Brightness
            </span>
            <Slider
              min={50}
              max={150}
              step={1}
              value={[brightness]}
              onValueChange={([v]) => setBrightness(v)}
              className="flex-1"
            />
            <span className="font-sora text-[11px] text-white/60 w-8 text-right">
              {brightness}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-sora text-[10px] text-white/40 uppercase tracking-widest w-20">
              Contrast
            </span>
            <Slider
              min={50}
              max={150}
              step={1}
              value={[contrast]}
              onValueChange={([v]) => setContrast(v)}
              className="flex-1"
            />
            <span className="font-sora text-[11px] text-white/60 w-8 text-right">
              {contrast}
            </span>
          </div>
        </div>

        {/* Save button */}
        <div className="px-5 pb-6 safe-bottom">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl font-outfit font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: saved
                ? "oklch(0.60 0.20 145)"
                : "oklch(var(--amber))",
              color: "oklch(0.07 0 0)",
              boxShadow: saved ? "none" : "0 0 20px oklch(0.72 0.18 68 / 30%)",
            }}
          >
            {saved ? <Check size={16} /> : null}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
