"use client";

/**
 * Dashboard colour (Account › Dashboard colour): the colour behind the
 * balance on Home, after the user's reference (a smart-home "Color" screen):
 * white in light mode, black in dark mode.
 *
 *   (‹)              COLOUR              RESET   ← reset: back to green
 *   DASHBOARD BRIGHTNESS
 *   85%  ━━━━━━━━━━━━━━━━━━●━━━━━                ← how light the colour is
 *          HUE      TEMPERATURE                  ← two rings, same knob
 *            ╭───────────────────────────────╮
 *           ( ○ ← knob: drag round (or tap)   )   ← HUE: every colour
 *           (        ⬤  the colour in use     )     TEMPERATURE: warm (amber) to
 *            ╰───────────────────────────────╯     cool (blue), greys between
 *
 *   (+) ● ● ● ● ● ● ● ● →                        ← at the bottom: "+" keeps the
 *                                                  current colour; then your kept
 *                                                  colours and the ready-made ones
 *
 * Changes apply straight away and are remembered on this device
 * (useThemeStore). Whatever is picked, customColor() deepens it just enough
 * that the white balance text stays readable; the centre of the ring shows
 * the colour exactly as Home will use it.
 */

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PlusIcon } from "@/components/icons";
import { ROUTES } from "@/config/routes";
import {
  asCustomColor,
  chosenDashboardColor,
  customColor,
  DASHBOARD_COLORS,
  dashboardColor,
  swatchGradient,
  WHEEL_SATURATION,
  type CustomColor,
  type DashboardColor,
} from "@/features/dashboard/dashboardTheme";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { hexToHsl } from "@/lib/color";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/useThemeStore";

/** White page in light mode, black in dark (the phone's status bar matches). */
const PAGE_COLORS = { light: "#f4f4ef", dark: "#0a0a0a" };

/** Small, spaced capitals, like the reference's labels. */
const LABEL = "text-[0.6875rem] font-semibold tracking-[0.14em] uppercase";

const sameColor = (a: CustomColor, b: CustomColor) =>
  a.hue === b.hue && a.saturation === b.saturation && a.brightness === b.brightness;

/* ── Temperature: warm amber ↔ white ↔ cool blue, like a light's colour temperature ── */

const WARM = [255, 138, 61]; // amber
const NEUTRAL = [244, 244, 245]; // white
const COOL = [91, 180, 255]; // light blue

/** The temperature colour at `t` (0 warmest → 0.5 white → 1 coolest), as "#rrggbb". */
function temperatureHex(t: number): string {
  const [from, to, f] = t <= 0.5 ? [WARM, NEUTRAL, t * 2] : [NEUTRAL, COOL, (t - 0.5) * 2];
  return `#${from.map((channel, i) => Math.round(channel + (to[i] - channel) * f).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Where a colour sits on the temperature ring: warm hues (reds to yellows)
 * towards 0, cool ones (cyans to blues) towards 1, the stronger the colour
 * the further out; greys in the middle.
 */
function temperatureOf({ hue, saturation }: CustomColor): number {
  const strength = Math.min(saturation / 100, 1);
  return hue < 100 || hue > 300 ? 0.5 - strength / 2 : 0.5 + strength / 2;
}

/* Ring angle ↔ value. The hue ring is the colour circle itself (0° at the
   top, clockwise). The temperature ring runs warm (top) → white (sides) →
   cool (bottom), mirrored left and right, so t = (1 − cos θ) / 2. */
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const temperatureAt = (angle: number) => (1 - Math.cos(toRadians(angle))) / 2;
const angleForTemperature = (t: number) => (Math.acos(1 - 2 * t) * 180) / Math.PI;

export function DashboardColorScreen() {
  useStatusBarColor(PAGE_COLORS);
  const presetId = useThemeStore((state) => state.dashboardColor);
  const custom = useThemeStore((state) => state.customDashboardColor);
  const saved = useThemeStore((state) => state.savedDashboardColors);
  const setDashboardColor = useThemeStore((state) => state.setDashboardColor);
  const setCustomDashboardColor = useThemeStore((state) => state.setCustomDashboardColor);
  const saveDashboardColor = useThemeStore((state) => state.saveDashboardColor);
  const resetDashboardColor = useThemeStore((state) => state.resetDashboardColor);
  const [tab, setTab] = useState<"hue" | "temperature">("hue");
  // The temperature ring is mirrored (left and right halves match), so the
  // knob stays exactly where it was put rather than being worked out from the
  // colour (which would jump it to the right half). Cleared when a swatch or
  // Reset sets the colour some other way.
  const [temperatureKnob, setTemperatureKnob] = useState<number | null>(null);

  const chosen = chosenDashboardColor(presetId, custom);
  // The rings and slider start from whatever is in use (a preset included).
  const current = custom ?? asCustomColor(dashboardColor(presetId));
  const isSaved = saved.some((color) => sameColor(color, current));

  const pickHue = (hue: number) =>
    setCustomDashboardColor({
      hue: Math.round(hue) % 360,
      // Greys (Black, Graphite, the middle of Temperature) have next to no
      // colour: the hue ring brings it back.
      saturation: current.saturation < 30 ? WHEEL_SATURATION : current.saturation,
      brightness: current.brightness,
    });

  const pickTemperature = (angle: number) => {
    setTemperatureKnob(angle);
    const { hue, saturation } = hexToHsl(temperatureHex(temperatureAt(angle)));
    setCustomDashboardColor({
      hue: Math.round(hue),
      saturation: Math.round(saturation),
      brightness: current.brightness,
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
        <Link
          href={ROUTES.account}
          aria-label="Back to account"
          className="grid size-11 place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-center text-sm font-semibold tracking-[0.18em] uppercase">Colour</h1>
        <button
          type="button"
          onClick={() => {
            resetDashboardColor();
            setTemperatureKnob(null);
          }}
          aria-label="Reset to the default colour (green)"
          className={cn(
            LABEL,
            "h-11 cursor-pointer text-right text-[0.625rem] text-neutral-500 transition-colors hover:text-foreground dark:text-neutral-400",
          )}
        >
          Reset
        </button>
      </header>

      {/* Brightness, like the reference's top slider. */}
      <section aria-labelledby="brightness-label" className="mt-8">
        <p id="brightness-label" className={cn(LABEL, "text-neutral-500")}>
          Dashboard brightness
        </p>
        <div className="mt-3 flex items-center gap-4">
          <span className="w-11 text-sm font-semibold tabular-nums">{current.brightness}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={current.brightness}
            aria-labelledby="brightness-label"
            onChange={(event) => setCustomDashboardColor({ ...current, brightness: Number(event.target.value) })}
            style={{ "--fill": `${current.brightness}%` } as React.CSSProperties}
            className={cn(
              "h-1.5 flex-1 cursor-pointer appearance-none rounded-full",
              // The filled part: dark on white, white on black.
              "bg-[linear-gradient(to_right,var(--color-neutral-900)_var(--fill),var(--color-neutral-200)_var(--fill))]",
              "dark:bg-[linear-gradient(to_right,white_var(--fill),rgb(255_255_255/0.15)_var(--fill))]",
              "[&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:ring-[3px] [&::-webkit-slider-thumb]:ring-neutral-900",
              "[&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:ring-[3px] [&::-moz-range-thumb]:ring-neutral-900",
              "outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-4 focus-visible:ring-offset-background",
            )}
          />
        </div>
      </section>

      {/* Tabs: the colour circle, or warm ↔ cool. */}
      <div role="tablist" aria-label="Colour" className="mt-9 flex justify-center gap-10 border-b border-neutral-200 dark:border-white/10">
        {(["hue", "temperature"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls="colour-panel"
            onClick={() => setTab(id)}
            className={cn(
              LABEL,
              "relative cursor-pointer pb-3 transition-colors",
              tab === id
                ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground"
                : "text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300",
            )}
          >
            {id === "hue" ? "Hue" : "Temperature"}
          </button>
        ))}
      </div>

      <div id="colour-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-9 flex justify-center">
        {tab === "hue" ? (
          <ColorRing
            key="hue"
            label="Hue"
            ring={`conic-gradient(${Array.from({ length: 13 }, (_, step) => `hsl(${step * 30} 85% 55%)`).join(", ")})`}
            angle={current.hue}
            valueText={`${Math.round(current.hue)} degrees`}
            color={chosen}
            onAngle={pickHue}
          />
        ) : (
          <ColorRing
            key="temperature"
            label="Temperature"
            // Warm at the top, white at the sides, cool at the bottom (both halves).
            ring={`conic-gradient(${temperatureHex(0)}, ${temperatureHex(0.5)}, ${temperatureHex(1)}, ${temperatureHex(0.5)}, ${temperatureHex(0)})`}
            angle={temperatureKnob ?? angleForTemperature(temperatureOf(current))}
            valueText={(() => {
              const t = temperatureOf(current);
              return t < 0.4 ? "Warm" : t > 0.6 ? "Cool" : "Neutral";
            })()}
            color={chosen}
            onAngle={pickTemperature}
          />
        )}
      </div>

      {/* Quick colours, at the bottom as in the reference: keep this one, your
          kept ones, then the ready-made ones (swipe sideways). */}
      <div
        role="group"
        aria-label="Quick colours"
        className="-mx-5 mt-auto flex gap-3 overflow-x-auto px-5 pt-10 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          onClick={() => saveDashboardColor(current)}
          disabled={isSaved}
          aria-label={isSaved ? "This colour is kept" : "Keep this colour"}
          title={isSaved ? "Kept" : "Keep this colour"}
          className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-dashed border-neutral-300 text-neutral-500 transition-colors hover:border-neutral-400 hover:text-foreground disabled:cursor-default disabled:opacity-40 dark:border-white/25 dark:text-neutral-400"
        >
          <PlusIcon className="size-5" />
        </button>
        {saved.map((color) => (
          <Swatch
            key={`${color.hue}-${color.saturation}-${color.brightness}`}
            color={customColor(color)}
            label="Your colour"
            isSelected={Boolean(custom && sameColor(custom, color))}
            onSelect={() => {
              setCustomDashboardColor(color);
              setTemperatureKnob(null);
            }}
          />
        ))}
        {DASHBOARD_COLORS.map((color) => (
          <Swatch
            key={color.id}
            color={color}
            label={color.name}
            isSelected={!custom && presetId === color.id}
            onSelect={() => {
              setDashboardColor(color.id);
              setTemperatureKnob(null);
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** One round colour in the quick row; the one in use is ringed. */
function Swatch({
  color,
  label,
  isSelected,
  onSelect,
}: {
  color: DashboardColor;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isSelected}
      title={label}
      onClick={onSelect}
      className={cn(
        "size-12 shrink-0 cursor-pointer rounded-full transition-transform active:scale-95",
        isSelected && "ring-2 ring-foreground ring-offset-[3px] ring-offset-background",
      )}
      style={{ backgroundImage: swatchGradient(color) }}
    />
  );
}

/**
 * A colour ring (the hue circle, or warm ↔ cool) with a knob to drag round it
 * (or tap anywhere on it); the centre shows the colour Home will use. The
 * knob is a slider for keyboards and screen readers (arrow keys: 5° steps).
 */
function ColorRing({
  label,
  ring,
  angle,
  valueText,
  color,
  onAngle,
}: {
  label: string;
  /** The ring's colours, as a CSS conic-gradient (0° at the top, clockwise). */
  ring: string;
  /** Where the knob sits, in degrees. */
  angle: number;
  valueText: string;
  color: DashboardColor;
  onAngle: (angle: number) => void;
}) {
  const ringRef = useRef<HTMLDivElement>(null);

  /** The angle at the pointer: 0° at the top, clockwise (as the ring is drawn). */
  const angleAt = (event: React.PointerEvent) => {
    const box = ringRef.current!.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    return ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  };

  // The knob sits in the middle of the ring (the ring is the outer quarter of the radius).
  const knob = {
    left: 50 + 43.75 * Math.sin(toRadians(angle)),
    top: 50 - 43.75 * Math.cos(toRadians(angle)),
  };

  return (
    <div
      ref={ringRef}
      className="relative aspect-square w-full max-w-[19.5rem] touch-none select-none"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onAngle(angleAt(event));
      }}
      onPointerMove={(event) => {
        if (event.buttons > 0) onAngle(angleAt(event));
      }}
    >
      {/* The ring, with its middle cut out. */}
      <div
        aria-hidden
        className="absolute inset-0 cursor-pointer rounded-full"
        style={{
          backgroundImage: ring,
          maskImage: "radial-gradient(farthest-side, transparent 74.5%, #000 75.5%)",
          WebkitMaskImage: "radial-gradient(farthest-side, transparent 74.5%, #000 75.5%)",
        }}
      />
      {/* The colour in use. */}
      <div
        aria-hidden
        className="absolute inset-[27%] rounded-full"
        style={{ backgroundImage: swatchGradient(color) }}
      />
      {/* The knob. */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={Math.round(angle)}
        aria-valuetext={valueText}
        onKeyDown={(event) => {
          const steps: Record<string, number> = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 };
          if (event.key in steps) {
            event.preventDefault();
            onAngle((angle + steps[event.key] + 360) % 360);
          }
        }}
        className="absolute size-8 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-[3px] border-neutral-900 bg-white outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 active:cursor-grabbing dark:border-black"
        style={{ left: `${knob.left}%`, top: `${knob.top}%` }}
      />
    </div>
  );
}
