"use client";

/**
 * Dashboard colour (Account › Dashboard colour): the colour behind the
 * balance on Home, after the user's reference (a smart-home "Color" screen):
 * white in light mode, black in dark mode.
 *
 *   (‹)              COLOUR              RESET   ← reset: back to green
 *   DASHBOARD
 *   85%  ━━━━━━━━━━━━━━━━━━●━━━━━                ← brightness: how light the colour is
 *          HUE      PREVIEW                      ← tabs
 *            ╭────── ring of every hue ──────╮
 *           ( ○ ← knob: drag round to pick   )   ← HUE: the colour wheel; the
 *           (        ⬤  the colour in use     )     centre shows the actual colour
 *            ╰───────────────────────────────╯     PREVIEW: the balance area in it
 *   (+) ● ● ● ● ● ● ● ● →                        ← "+" keeps the current colour;
 *                                                  then your kept colours, then the
 *                                                  ready-made ones (swipe sideways)
 *
 * Changes apply straight away and are remembered on this device
 * (useThemeStore). Any hue works: customColor() deepens it just enough that
 * the white balance text stays readable.
 */

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, PlusIcon } from "@/components/icons";
import { ROUTES } from "@/config/routes";
import { currentValue } from "@/features/analytics/portfolioHistory";
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
import { useTransactions } from "@/features/transactions/useTransactions";
import { useStatusBarColor } from "@/hooks/useStatusBarColor";
import { CEDI_SYMBOL, formatCedisNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/useThemeStore";

/** White page in light mode, black in dark (the phone's status bar matches). */
const PAGE_COLORS = { light: "#ffffff", dark: "#0a0a0a" };

const sameColor = (a: CustomColor, b: CustomColor) =>
  a.hue === b.hue && a.saturation === b.saturation && a.brightness === b.brightness;

/** Small, spaced capitals, like the reference's labels. */
const LABEL = "text-[0.6875rem] font-semibold tracking-[0.14em] uppercase";

export function DashboardColorScreen() {
  useStatusBarColor(PAGE_COLORS);
  const presetId = useThemeStore((state) => state.dashboardColor);
  const custom = useThemeStore((state) => state.customDashboardColor);
  const saved = useThemeStore((state) => state.savedDashboardColors);
  const setDashboardColor = useThemeStore((state) => state.setDashboardColor);
  const setCustomDashboardColor = useThemeStore((state) => state.setCustomDashboardColor);
  const saveDashboardColor = useThemeStore((state) => state.saveDashboardColor);
  const resetDashboardColor = useThemeStore((state) => state.resetDashboardColor);
  const [tab, setTab] = useState<"hue" | "preview">("hue");

  const chosen = chosenDashboardColor(presetId, custom);
  // The wheel and slider start from whatever is in use (a preset included).
  const current = custom ?? asCustomColor(dashboardColor(presetId));
  const isSaved = saved.some((color) => sameColor(color, current));

  const pickHue = (hue: number) =>
    setCustomDashboardColor({
      hue: Math.round(hue) % 360,
      // Greys (Black, Graphite) have next to no colour: the wheel brings it back.
      saturation: current.saturation < 30 ? WHEEL_SATURATION : current.saturation,
      brightness: current.brightness,
    });

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
          onClick={resetDashboardColor}
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
        <p id="brightness-label" className={cn(LABEL, "text-neutral-400")}>
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

      {/* Tabs: the wheel, or a preview of Home in the colour. */}
      <div role="tablist" aria-label="Colour" className="mt-9 flex justify-center gap-10 border-b border-neutral-200 dark:border-white/10">
        {(["hue", "preview"] as const).map((id) => (
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
                : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
            )}
          >
            {id === "hue" ? "Hue" : "Preview"}
          </button>
        ))}
      </div>

      <div id="colour-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-9 flex justify-center">
        {tab === "hue" ? (
          <HueWheel hue={current.hue} color={chosen} onHue={pickHue} />
        ) : (
          <HomePreview color={chosen} />
        )}
      </div>

      {/* Quick colours: keep this one, your kept ones, then the ready-made ones. */}
      <div
        role="group"
        aria-label="Quick colours"
        className="-mx-5 mt-10 flex gap-3 overflow-x-auto px-5 pt-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            onSelect={() => setCustomDashboardColor(color)}
          />
        ))}
        {DASHBOARD_COLORS.map((color) => (
          <Swatch
            key={color.id}
            color={color}
            label={color.name}
            isSelected={!custom && presetId === color.id}
            onSelect={() => setDashboardColor(color.id)}
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
 * The colour wheel: a ring of every hue, with a knob to drag round it (or
 * tap anywhere on it); the centre shows the colour the dashboard will use
 * (deepened, if needed, to keep white text readable). The knob is a slider
 * for keyboards and screen readers (arrow keys: 5° steps).
 */
function HueWheel({ hue, color, onHue }: { hue: number; color: DashboardColor; onHue: (hue: number) => void }) {
  const wheelRef = useRef<HTMLDivElement>(null);

  /** The hue at the pointer: 0° at the top, clockwise (as the ring is drawn). */
  const hueAt = (event: React.PointerEvent) => {
    const box = wheelRef.current!.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    return ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  };

  // The knob sits in the middle of the ring (the ring is the outer quarter of the radius).
  const angle = (hue * Math.PI) / 180;
  const knob = { left: 50 + 43.75 * Math.sin(angle), top: 50 - 43.75 * Math.cos(angle) };
  const spectrum = Array.from({ length: 13 }, (_, step) => `hsl(${step * 30} 85% 55%)`).join(", ");

  return (
    <div
      ref={wheelRef}
      className="relative aspect-square w-full max-w-[19.5rem] touch-none select-none"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onHue(hueAt(event));
      }}
      onPointerMove={(event) => {
        if (event.buttons > 0) onHue(hueAt(event));
      }}
    >
      {/* The ring: a full circle of hues, with its middle cut out. */}
      <div
        aria-hidden
        className="absolute inset-0 cursor-pointer rounded-full"
        style={{
          backgroundImage: `conic-gradient(${spectrum})`,
          maskImage: "radial-gradient(farthest-side, transparent 74.5%, #000 75.5%)",
          WebkitMaskImage: "radial-gradient(farthest-side, transparent 74.5%, #000 75.5%)",
        }}
      />
      {/* The colour in use. */}
      <div
        aria-hidden
        className="absolute inset-[27%] rounded-full transition-[background-image] duration-150"
        style={{ backgroundImage: swatchGradient(color) }}
      />
      {/* The knob. */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={Math.round(hue)}
        aria-valuetext={`${Math.round(hue)} degrees`}
        onKeyDown={(event) => {
          const steps: Record<string, number> = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 };
          if (event.key in steps) {
            event.preventDefault();
            onHue((hue + steps[event.key] + 360) % 360);
          }
        }}
        className="absolute size-8 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-[3px] border-neutral-900 bg-white outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 active:cursor-grabbing dark:border-black"
        style={{ left: `${knob.left}%`, top: `${knob.top}%` }}
      />
    </div>
  );
}

/** The balance area of Home in the colour (decorative), with their real balance. */
function HomePreview({ color }: { color: DashboardColor }) {
  const transactions = useTransactions();
  const [whole, fraction] = formatCedisNumber(transactions ? currentValue(transactions) : 0, {
    exact: true,
  }).split(".");

  return (
    <div
      aria-hidden
      className="flex aspect-square w-full max-w-[19.5rem] flex-col justify-center rounded-[2rem] px-6 text-white"
      style={{ backgroundImage: `linear-gradient(to bottom, ${color.top}, ${color.main})` }}
    >
      <p className="text-xs font-medium text-white/85">Portfolio value</p>
      <p className="mt-2.5 flex items-baseline gap-1.5 leading-none font-bold">
        <span className="text-base text-white/90">{CEDI_SYMBOL}</span>
        <span className="text-[1.875rem] tracking-[-0.03em] tabular-nums">
          {whole}
          <span className="text-lg text-white/80">.{fraction}</span>
        </span>
      </p>
      <div className="mt-6 flex gap-2">
        <span className="flex h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-white text-xs font-semibold text-neutral-900">
          <PlusIcon className="size-3.5" />
          Invest
        </span>
        <span className="flex h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-white text-xs font-semibold text-neutral-900">
          <ArrowRight className="size-3.5 rotate-90" />
          Withdraw
        </span>
      </div>
    </div>
  );
}
