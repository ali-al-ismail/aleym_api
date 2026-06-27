import { Slider } from "@/components/ui/slider";
import { useState } from "react";

export const MINUTE = 60;
export const HOUR = 3600;
export const DAY = 86400;
export const WEEK = 604800;
export const MONTH = 2592000;

function secondsToSlider(seconds: number, min: number, max: number): number {
  return (Math.log(seconds / min) / Math.log(max / min)) * 100;
}

function sliderToSeconds(position: number, min: number, max: number): number {
  return Math.round(min * Math.pow(max / min, position / 100));
}

export function formatDuration(seconds: number): string {
  if (seconds < MINUTE) return `${seconds}s`;
  if (seconds < HOUR) {
    const m = Math.floor(seconds / MINUTE);
    const s = seconds % MINUTE;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  if (seconds < DAY) {
    const h = Math.floor(seconds / HOUR);
    const m = Math.floor((seconds % HOUR) / MINUTE);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (seconds < WEEK) {
    const d = Math.floor(seconds / DAY);
    const h = Math.floor((seconds % DAY) / HOUR);
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
  }
  if (seconds < MONTH) {
    const w = Math.floor(seconds / WEEK);
    const d = Math.floor((seconds % WEEK) / DAY);
    return d > 0 ? `${w}w ${d}d` : `${w}w`;
  }
  const m = Math.floor(seconds / MONTH);
  const w = Math.floor((seconds % MONTH) / WEEK);
  return w > 0 ? `${m}mo ${w}w` : `${m}mo`;
}

interface SteppedSliderProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  markers?: number[];
  logarithmic?: boolean;
  format?: (value: number) => string;
}

export function SteppedSlider({
  value,
  onChange,
  min,
  max,
  markers = [],
  logarithmic = true,
  format = formatDuration,
}: SteppedSliderProps) {
  const [active, setActive] = useState(false);

  const sliderPosition = logarithmic
    ? secondsToSlider(Math.max(min, Math.min(max, value)), min, max)
    : ((value - min) / (max - min)) * 100;

  function handleChange(pos: number) {
    if (logarithmic) {
      onChange(sliderToSeconds(pos, min, max));
    } else {
      onChange(min + (pos / 100) * (max - min));
    }
  }

  return (
    <div className="w-full space-y-4">
      <div
        className="relative pt-6"
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
      >
        {active && (
          <div
            className="absolute top-0 text-xs font-medium text-primary bg-background border rounded px-1.5 py-0.5 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${sliderPosition}%` }}
          >
            {format(value)}
          </div>
        )}
        <Slider
          min={0}
          max={100}
          step={0.1}
          value={[sliderPosition]}
          onValueChange={([pos]) => handleChange(pos)}
        />
      </div>
      {markers.length > 0 && (
        <div className="relative h-4">
          {markers.map((marker) => {
            const pos = logarithmic
              ? secondsToSlider(marker, min, max)
              : ((marker - min) / (max - min)) * 100;
            if (pos < 0 || pos > 100) return null;
            return (
              <span
                key={marker}
                className="absolute text-xs text-muted-foreground -translate-x-1/2"
                style={{ left: `${pos}%` }}
              >
                {format(marker)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
