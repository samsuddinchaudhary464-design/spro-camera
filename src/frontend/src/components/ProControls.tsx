import { Slider } from "@/components/ui/slider";

export interface ProSettings {
  iso: number;
  shutter: number;
  whiteBalance: number;
  exposure: number;
}

interface ProControlsProps {
  settings: ProSettings;
  onChange: (settings: ProSettings) => void;
}

const SHUTTER_VALUES = [1000, 500, 250, 125, 60, 30, 15, 8, 4, 2, 1];

function formatShutter(index: number): string {
  const v = SHUTTER_VALUES[Math.round(index)];
  if (!v) return "1s";
  if (v === 1) return "1s";
  return `1/${v}`;
}

function formatWB(v: number): string {
  return `${Math.round(v)}K`;
}

function formatExposure(v: number): string {
  const rounded = Math.round(v * 10) / 10;
  return rounded >= 0 ? `+${rounded}` : `${rounded}`;
}

interface SliderRowProps {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (v: number) => void;
  accent?: boolean;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
  accent,
}: SliderRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span
          className="font-sora text-[10px] font-bold tracking-widest uppercase"
          style={{
            color: accent ? "oklch(var(--amber))" : "rgba(255,255,255,0.5)",
          }}
        >
          {label}
        </span>
        <span
          className="font-sora text-[11px] font-semibold"
          style={{
            color: accent ? "oklch(var(--amber))" : "rgba(255,255,255,0.9)",
          }}
        >
          {value}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[current]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}

export function ProControls({ settings, onChange }: ProControlsProps) {
  return (
    <div
      className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 p-3 rounded-r-2xl camera-glass w-[140px] z-20"
      style={{ background: "oklch(0.10 0 0 / 85%)" }}
    >
      <SliderRow
        label="ISO"
        value={`${settings.iso}`}
        min={100}
        max={3200}
        step={100}
        current={settings.iso}
        onChange={(v) => onChange({ ...settings, iso: v })}
      />
      <SliderRow
        label="Shutter"
        value={formatShutter(settings.shutter)}
        min={0}
        max={10}
        step={1}
        current={settings.shutter}
        onChange={(v) => onChange({ ...settings, shutter: v })}
      />
      <SliderRow
        label="WB"
        value={formatWB(settings.whiteBalance)}
        min={2000}
        max={8000}
        step={100}
        current={settings.whiteBalance}
        onChange={(v) => onChange({ ...settings, whiteBalance: v })}
      />
      <SliderRow
        label="EV"
        value={formatExposure(settings.exposure)}
        min={-3}
        max={3}
        step={0.1}
        current={settings.exposure}
        onChange={(v) => onChange({ ...settings, exposure: v })}
        accent
      />
    </div>
  );
}
